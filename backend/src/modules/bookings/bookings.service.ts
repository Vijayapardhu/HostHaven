import prisma from "../../config/database";
import { logger } from "../../utils/logger.util";
import { generateBookingNumber, generateInvoiceId } from "../../utils/crypto.util";
import { hashPassword } from "../../utils/hash.util";
import inventoryService from "../inventory/inventory.service";
import { ERROR_CODES } from "../../constants/error-codes";
import { Prisma } from "@prisma/client";
import Razorpay from "razorpay";
import { config } from "../../config";
import notificationsService from "../notifications/notifications.service";
import adminService from "../admin/admin.service";
import { cacheService } from "../../services/cache.service";
import { generateInvoicePDF } from "../../services/pdf-invoice.service";
import { sendEmail } from "../../services/email.service";

export class BookingsService {
  async syncBookingStatuses() {
    const now = new Date();
    
    const result = await prisma.booking.updateMany({
      where: {
        status: "CONFIRMED",
        checkOutDate: { lt: now },
        isDeleted: false,
      },
      data: {
        status: "CHECKED_OUT",
      },
    });

    if (result.count > 0) {
      logger.info({ count: result.count }, "Auto-completed bookings based on checkout date");
    }

    return result.count;
  }

  async create(data: {
    propertyId: string;
    roomId?: string;
    checkInDate: Date;
    checkOutDate: Date;
    adults: number;
    children: number;
    extraBeds: number;
    specialRequests?: string;
    guestDetails?: any[];
    userId: string;
    guestPhone?: string;
  }) {
    const property = await prisma.property.findFirst({
      where: { id: data.propertyId, isDeleted: false },
      include: {
        rooms: data.roomId
          ? { where: { id: data.roomId, isDeleted: false, isActive: true } }
          : { where: { isDeleted: false, isActive: true } },
      },
    });

    if (!property) {
      const error = new Error("Property not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const featureFlags = property.featureFlags as Record<string, any> | null;
    const taxPercent = featureFlags?.taxPercent || 12;

    const room = data.roomId
      ? property.rooms.find((r) => r.id === data.roomId)
      : property.rooms[0];

    if (!room) {
      const error = new Error("Room not found");
      (error as any).code = ERROR_CODES.ROOM_NOT_FOUND;
      throw error;
    }

    const stayDates: Date[] = [];
    const current = new Date(data.checkInDate);
    while (current < data.checkOutDate) {
      stayDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    if (stayDates.length === 0) {
      const error = new Error("Invalid stay dates");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const totalGuests = data.adults + data.children;
    if (totalGuests > room.capacity + room.extraBedCapacity) {
      const error = new Error("Exceeds room capacity");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const nights = Math.ceil(
      (data.checkOutDate.getTime() - data.checkInDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const basePrice = room.pricePerNight.toNumber();
    const baseAmount = basePrice * nights;
    const extraBedAmount = data.extraBeds * 500 * nights;
    const taxableAmount = baseAmount + extraBedAmount;
    const taxRate = taxPercent / 100;
    const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

    const roomUnavailableError = new Error("Room not available for selected dates");
    (roomUnavailableError as any).code = ERROR_CODES.ROOM_NOT_AVAILABLE;

    let booking: any;
    let payment: any;
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          await Promise.all(
            stayDates.map((date) =>
              tx.inventoryDay.upsert({
                where: {
                  roomId_date: {
                    roomId: room.id,
                    date,
                  },
                },
                update: {},
                create: {
                  roomId: room.id,
                  date,
                  totalRooms: room.totalRooms,
                  availableRooms: room.totalRooms,
                },
              }),
            ),
          );

          const decrements = await Promise.all(
            stayDates.map((date) =>
              tx.inventoryDay.updateMany({
                where: {
                  roomId: room.id,
                  date,
                  availableRooms: { gt: 0 },
                },
                data: {
                  availableRooms: {
                    decrement: 1,
                  },
                },
              }),
            ),
          );

          if (decrements.some((result) => result.count !== 1)) {
            throw roomUnavailableError;
          }

          const createdBooking = await tx.booking.create({
            data: {
              bookingNumber: generateBookingNumber(),
              userId: data.userId,
              propertyId: data.propertyId,
              roomId: room.id,
              checkInDate: data.checkInDate,
              checkOutDate: data.checkOutDate,
              adults: data.adults,
              children: data.children,
              extraBeds: data.extraBeds,
              baseAmount: new Prisma.Decimal(baseAmount + extraBedAmount),
              taxAmount: new Prisma.Decimal(taxAmount),
              discountAmount: new Prisma.Decimal(0),
              totalAmount: new Prisma.Decimal(totalAmount),
              specialRequests: data.specialRequests,
              guestDetails: data.guestDetails,
              guestPhone: data.guestPhone,
              status: "PENDING",
            },
            include: {
              property: true,
              room: true,
            },
          });

          // Update user profile with phone number if provided
          if (data.guestPhone) {
            await tx.user.update({
              where: { id: data.userId },
              data: { phone: data.guestPhone },
            });
          }

          const createdPayment = await tx.payment.create({
            data: {
              bookingId: createdBooking.id,
              amount: createdBooking.totalAmount,
              currency: "INR",
              status: "PENDING",
            },
          });

          return { booking: createdBooking, payment: createdPayment };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      booking = result.booking;
      payment = result.payment;
    } catch (error: any) {
      if (error?.code === "P2034") {
        throw roomUnavailableError;
      }
      throw error;
    }

    if (data.roomId) {
      await inventoryService.releaseLock(data.roomId, data.userId);
    }

    logger.info(
      { bookingId: booking.id, bookingNumber: booking.bookingNumber },
      "Booking created",
    );

    // Invalidate per-user booking cache
    await cacheService.invalidate(`hosthaven:bookings:user:${data.userId}:*`);

    // Send notifications
    await this.sendBookingNotifications(booking, property, "CREATED");

    return {
      booking: this.sanitizeBooking(booking),
      payment: {
        id: payment.id,
        amount: payment.amount.toNumber(),
        currency: payment.currency,
      },
    };
  }

  private async sendBookingNotifications(
    booking: any,
    property: any,
    action: string,
  ) {
    try {
      let userTitle = "";
      let userMessage = "";
      let vendorTitle = "";
      let vendorMessage = "";
      const guestPhone = booking.guestPhone || booking.user?.phone || "N/A";

      switch (action) {
        case "CREATED":
          userTitle = "Booking Created";
          userMessage = `Your booking at ${property.name} has been created and is awaiting payment confirmation. Booking #: ${booking.bookingNumber}.`;
          break;
        case "CONFIRMED":
          userTitle = "Booking Confirmed";
          userMessage = `Your booking at ${property.name} is confirmed. Booking #: ${booking.bookingNumber}. Phone: ${guestPhone}`;
          vendorTitle = "Booking Confirmed";
          vendorMessage = `A user booking has been confirmed at ${property.name}. Guest: ${booking.user?.name || "Guest"}, Phone: ${guestPhone}. Booking #: ${booking.bookingNumber}`;
          break;
        case "CHECKED_IN":
          userTitle = "Checked In";
          userMessage = `You have checked in at ${property.name}. Enjoy your stay!`;
          vendorTitle = "Guest Check-in";
          vendorMessage = `${booking.user?.name || "Guest"} (${guestPhone}) has checked in to ${property.name}`;
          break;
        case "CHECKED_OUT":
          userTitle = "Checked Out";
          userMessage = `You have checked out from ${property.name}. Thank you for staying with us! Share your experience by leaving a review.`;
          vendorTitle = "Guest Check-out";
          vendorMessage = `${booking.user?.name || "Guest"} (${guestPhone}) has checked out from ${property.name}`;
          await prisma.booking.update({
            where: { id: booking.id },
            data: { isReviewed: false }
          });
          break;
        case "CANCELLED":
          userTitle = "Booking Cancelled";
          userMessage = `Your booking at ${property.name} has been cancelled.`;
          vendorTitle = "Booking Cancelled";
          vendorMessage = `${booking.user?.name || "Guest"} has cancelled their booking.`;
          break;
      }

      if (userTitle && userMessage) {
        await notificationsService.create({
          userId: booking.userId,
          type: `BOOKING_${action}`,
          title: userTitle,
          message: userMessage,
          data: {
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            propertyId: property.id,
          },
        });
      }

      if (property.vendorId && vendorTitle && vendorMessage) {
        // Resolve vendor's userId for notifications (vendorId is Vendor.id, not User.id)
        const vendor = await prisma.vendor.findUnique({
          where: { id: property.vendorId },
          select: { userId: true },
        });
        const vendorUserId = vendor?.userId;

        if (vendorUserId) {
          await notificationsService.create({
            userId: vendorUserId,
            type: `BOOKING_${action}`,
            title: vendorTitle,
            message: vendorMessage,
            data: {
              bookingId: booking.id,
              bookingNumber: booking.bookingNumber,
              propertyId: property.id,
            },
          });
        }
      }
    } catch (error) {
      logger.error({ error }, "Failed to send booking notifications");
    }
  }

  async getById(id: string, userId?: string) {
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        isDeleted: false,
        ...(userId ? { userId } : {}),
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            rating: true,
            reviewCount: true,
            images: true,
            vendor: {
              select: {
                id: true,
                businessName: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            type: true,
            availableRooms: true,
            totalRooms: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            method: true,
            amount: true,
            currency: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!booking) {
      const error = new Error("Booking not found");
      (error as any).code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    return this.sanitizeBooking(booking);
  }

  async getUserBookings(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    await this.syncBookingStatuses();

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = { userId, isDeleted: false };

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.startDate || filters.endDate) {
      where.checkInDate = {};
      if (filters.startDate) {
        where.checkInDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.checkInDate.lte = filters.endDate;
      }
    }

    const cacheKey = cacheService.keys.userBookings(
      userId,
      JSON.stringify(filters),
    );
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              type: true,
              city: true,
              state: true,
              address: true,
              pincode: true,
              images: true,
            },
          },
          room: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
              method: true,
              amount: true,
              currency: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const result = {
      bookings: bookings.map((b) => this.sanitizeBooking(b)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await cacheService.set(cacheKey, result, cacheService.getTTL().SHORT_LIST);
    return result;
  }

  async cancel(
    id: string,
    actorUserId: string,
    reason?: string,
    vendorId?: string,
  ) {
    const booking = await prisma.booking.findFirst({
      where: { id, isDeleted: false },
      include: { 
        property: { select: { vendorId: true } },
        payment: { select: { id: true, status: true } },
        user: { select: { id: true, name: true, email: true } },
      }
    });
    if (!booking) {
      const error = new Error('Booking not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }
    if (vendorId && booking.property.vendorId !== vendorId) {
      const error = new Error('Unauthorized');
      (error as any).code = ERROR_CODES.FORBIDDEN;
      throw error;
    }

    const fullBooking = await prisma.booking.findFirst({
      where: {
        id,
        isDeleted: false,
        ...(vendorId ? { property: { vendorId } } : { userId: actorUserId }),
      },
      include: {
        payment: true,
        property: true,
        room: true,
        user: { select: { id: true, name: true } },
      },
    });

    if (!fullBooking) {
      const error = new Error("Booking not found");
      (error as any).code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    if (!["PENDING", "CONFIRMED"].includes(fullBooking.status)) {
      const error = new Error("Booking cannot be cancelled");
      (error as any).code = ERROR_CODES.BOOKING_CANNOT_CANCEL;
      throw error;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy: actorUserId,
        cancellationReason: reason,
      },
    });

    if (fullBooking.roomId) {
      const stayDates: Date[] = [];
      const current = new Date(fullBooking.checkInDate);
      while (current < fullBooking.checkOutDate) {
        stayDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      const room = await prisma.room.findUnique({
        where: { id: fullBooking.roomId },
      });
      if (room) {
        await prisma.$transaction(
          stayDates.map((date) =>
            prisma.inventoryDay.upsert({
              where: {
                roomId_date: {
                  roomId: fullBooking.roomId as string,
                  date,
                },
              },
              update: {
                availableRooms: {
                  increment: 1,
                },
              },
              create: {
                roomId: fullBooking.roomId as string,
                date,
                totalRooms: room.totalRooms,
                availableRooms: room.totalRooms,
              },
            }),
          ),
        );
      }
    }

    const payRec = fullBooking.payment;
    if (payRec?.status === "COMPLETED" && payRec.razorpayPaymentId) {
      try {
        const razorpayClient = new Razorpay({
          key_id: config.razorpay.keyId,
          key_secret: config.razorpay.keySecret,
        });

        const refundResponse = await razorpayClient.payments.refund(
          payRec.razorpayPaymentId,
          {
            amount: Math.round(Number(fullBooking.totalAmount) * 100),
            speed: "normal",
            notes: { reason: reason || "Booking cancelled" },
          },
        );

        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payRec.id },
            data: {
              status: "REFUNDED",
              refundedAt: new Date(),
              refundId: refundResponse.id,
            },
          }),
          prisma.refund.create({
            data: {
              paymentId: payRec.id,
              amount: fullBooking.totalAmount,
              razorpayRefundId: refundResponse.id,
              reason,
              status: "processed",
            },
          }),
        ]);
      } catch (refundError) {
        logger.error({ error: refundError, bookingId: id }, "Razorpay refund failed during cancellation");
        await prisma.refund.create({
          data: {
            paymentId: payRec.id,
            amount: fullBooking.totalAmount,
            reason,
            status: "initiated",
          },
        });
      }
    }

    await this.sendBookingNotifications(
      { ...updated, user: booking.user },
      booking.property,
      "CANCELLED",
    );

    // Invalidate per-user booking cache
    await cacheService.invalidate(`hosthaven:bookings:user:${booking.userId}:*`);

    logger.info({ bookingId: id }, "Booking cancelled");

    return {
      booking: this.sanitizeBooking(updated),
    };
  }

  async reschedule(
    id: string,
    actorUserId: string,
    newCheckInDate: string,
    newCheckOutDate: string,
    vendorId?: string,
  ) {
    const booking = await prisma.booking.findFirst({
      where: { id, isDeleted: false },
      include: {
        property: true,
        room: true,
        payment: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) {
      const error = new Error("Booking not found");
      (error as any).code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    if (vendorId && booking.property.vendorId !== vendorId) {
      const error = new Error("Unauthorized");
      (error as any).code = ERROR_CODES.FORBIDDEN;
      throw error;
    }

    if (!vendorId && booking.userId !== actorUserId) {
      const error = new Error("Unauthorized");
      (error as any).code = ERROR_CODES.FORBIDDEN;
      throw error;
    }

    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      const error = new Error("Booking cannot be rescheduled");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const checkIn = new Date(newCheckInDate);
    const checkOut = new Date(newCheckOutDate);

    if (checkIn >= checkOut) {
      const error = new Error("Check-out date must be after check-in date");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    if (checkIn < new Date()) {
      const error = new Error("Check-in date cannot be in the past");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const nightsNew = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (nightsNew < 1) {
      const error = new Error("Minimum 1 night required");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const bookingAny = booking as any;
    const pricePerNight = Number(bookingAny.pricePerNight || booking.room?.pricePerNight || 0);
    const weekendPrice = bookingAny.weekendPrice ? Number(bookingAny.weekendPrice) : pricePerNight;
    
    let newTotal = 0;
    for (let i = 0; i < nightsNew; i++) {
      const date = new Date(checkIn);
      date.setDate(date.getDate() + i);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      newTotal += isWeekend ? weekendPrice : pricePerNight;
    }

    if (bookingAny.extraBeds && bookingAny.extraBedPrice) {
      newTotal += Number(bookingAny.extraBedPrice) * bookingAny.extraBeds * nightsNew;
    }

    const taxRate = Number(booking.taxPercent || 12) / 100;
    const taxAmount = Math.round(newTotal * taxRate * 100) / 100;
    const grandTotal = Math.round((newTotal + taxAmount) * 100) / 100;

    if (booking.roomId && booking.room) {
      const oldDates: Date[] = [];
      const oldCur = new Date(booking.checkInDate);
      while (oldCur < booking.checkOutDate) {
        oldDates.push(new Date(oldCur));
        oldCur.setDate(oldCur.getDate() + 1);
      }
      const newDates: Date[] = [];
      const newCur = new Date(checkIn);
      while (newCur < checkOut) {
        newDates.push(new Date(newCur));
        newCur.setDate(newCur.getDate() + 1);
      }
      const roomId = booking.roomId as string;
      const totalRooms = Number((booking.room as any)?.totalRooms ?? 1);
      await prisma.$transaction([
        ...oldDates.map((date) =>
          prisma.inventoryDay.upsert({
            where: { roomId_date: { roomId, date } },
            update: { availableRooms: { increment: 1 } },
            create: { roomId, date, totalRooms, availableRooms: totalRooms },
          }),
        ),
        ...newDates.map((date) =>
          prisma.inventoryDay.upsert({
            where: { roomId_date: { roomId, date } },
            update: { availableRooms: { decrement: 1 } },
            create: { roomId, date, totalRooms, availableRooms: totalRooms - 1 },
          }),
        ),
      ]);
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalAmount: new Prisma.Decimal(grandTotal),
        taxAmount: new Prisma.Decimal(taxAmount),
      },
      include: {
        property: true,
        room: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await this.sendBookingNotifications(updated, booking.property, "RESCHEDULED");

    logger.info({ bookingId: id, newCheckIn: checkIn, newCheckOut: checkOut }, "Booking rescheduled");

    return {
      booking: this.sanitizeBooking(updated),
      priceDifference: grandTotal - Number(booking.totalAmount),
    };
  }

  async modifyBooking(
    id: string,
    actorUserId: string,
    data: {
      guests?: number;
      extraBeds?: number;
      specialRequests?: string;
      guestDetails?: any;
    },
    vendorId?: string,
  ) {
    const booking = await prisma.booking.findFirst({
      where: { id, isDeleted: false },
      include: {
        property: true,
        room: true,
      },
    });

    if (!booking) {
      const error = new Error("Booking not found");
      (error as any).code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    if (vendorId && booking.property.vendorId !== vendorId) {
      const error = new Error("Unauthorized");
      (error as any).code = ERROR_CODES.FORBIDDEN;
      throw error;
    }

    if (!vendorId && booking.userId !== actorUserId) {
      const error = new Error("Unauthorized");
      (error as any).code = ERROR_CODES.FORBIDDEN;
      throw error;
    }

    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      const error = new Error("Booking cannot be modified");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const nights = Math.ceil(
      (booking.checkOutDate.getTime() - booking.checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const updateData: any = {};
    
    if (data.guests !== undefined) {
      updateData.adults = data.guests;
    }
    
    if (data.extraBeds !== undefined) {
      const roomData = booking.room as any;
      const extraBedPrice = roomData?.extraBedPrice ? Number(roomData.extraBedPrice) : 500;
      const currentExtraBeds = booking.extraBeds || 0;
      const extraBedDiff = (data.extraBeds - currentExtraBeds) * extraBedPrice * nights;
      
      if (extraBedDiff !== 0) {
        updateData.extraBeds = data.extraBeds;
        updateData.totalAmount = new Prisma.Decimal(Number(booking.totalAmount) + extraBedDiff);
      }
    }
    
    if (data.specialRequests !== undefined) {
      updateData.specialRequests = data.specialRequests;
    }
    
    if (data.guestDetails !== undefined) {
      updateData.guestDetails = data.guestDetails;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        property: true,
        room: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await this.sendBookingNotifications(updated, booking.property, "MODIFIED");

    logger.info({ bookingId: id, modifications: data }, "Booking modified");

    return {
      booking: this.sanitizeBooking(updated),
    };
  }

  async checkPrice(data: {
    propertyId: string;
    roomId?: string;
    checkIn: Date;
    checkOut: Date;
    guests: number;
    extraBeds: number;
  }) {
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      include: {
        rooms: data.roomId
          ? { where: { id: data.roomId } }
          : { where: { isActive: true } },
      },
    });

    if (!property) {
      const error = new Error("Property not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const featureFlags = property.featureFlags as Record<string, any> | null;
    const taxPercent = featureFlags?.taxPercent || 12;

    const room = data.roomId
      ? property.rooms.find((r) => r.id === data.roomId)
      : property.rooms[0];

    if (!room) {
      const error = new Error("Room not found");
      (error as any).code = ERROR_CODES.ROOM_NOT_FOUND;
      throw error;
    }

    const nights = Math.ceil(
      (data.checkOut.getTime() - data.checkIn.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const basePrice = room.pricePerNight.toNumber();
    const baseAmount = basePrice * nights;
    const extraBedAmount = data.extraBeds * 500 * nights;
    const taxableAmount = baseAmount + extraBedAmount;
    const taxRate = taxPercent / 100;
    const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

    return {
      baseAmount,
      extraBedAmount,
      taxAmount,
      totalAmount,
      nights,
      breakdown: {
        roomPrice: basePrice,
        nights,
        extraBeds: data.extraBeds,
        extraBedPricePerNight: 500,
        taxRate: `${taxRate * 100}%`,
      },
    };
  }

  async updateStatus(id: string, status: string, vendorId?: string) {
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
      CHECKED_IN: ['CHECKED_OUT'],
      CHECKED_OUT: [],
      CANCELLED: [],
      NO_SHOW: [],
      REFUNDED: [],
    };

    const where: Prisma.BookingWhereInput = { id };

    if (vendorId) {
      where.property = { vendorId };
    }

    const booking = await prisma.booking.findFirst({ where });

    if (!booking) {
      const error = new Error("Booking not found");
      (error as any).code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    const allowed = validTransitions[booking.status];
    if (!allowed || !allowed.includes(status)) {
      const error = new Error(`Cannot transition from ${booking.status} to ${status}`);
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: status as any },
    });

    return this.sanitizeBooking(updated);
  }

  async getVendorBookings(
    vendorId: string,
    filters: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const properties = await prisma.property.findMany({
      where: { vendorId, isDeleted: false },
      select: { id: true },
    });
    const propertyIds = properties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return {
        bookings: [],
        meta: { page, limit, total: 0, totalPages: 0 },
      };
    }

    const where: any = {
      propertyId: { in: propertyIds },
      isDeleted: false,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.checkInDate = {};
      if (filters.startDate) {
        where.checkInDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.checkInDate.lte = filters.endDate;
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          property: { 
            select: { id: true, name: true, city: true, vendor: { select: { commissionRate: true } } } 
          },
          room: { select: { id: true, name: true, type: true, availableRooms: true, totalRooms: true } },
          user: { select: { id: true, name: true, email: true, phone: true } },
          payment: true,
          commissionLedger: true,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      bookings: bookings.map((b) => ({
        ...this.sanitizeBooking(b),
        commissionAmount: b.commissionLedger?.commissionAmount?.toNumber?.() || b.commissionLedger?.commissionAmount || 0,
        vendorEarning: b.commissionLedger?.vendorEarning?.toNumber?.() || b.commissionLedger?.vendorEarning || 0,
        commissionRate: b.commissionLedger?.commissionRate?.toNumber?.() || b.commissionLedger?.commissionRate || b.property?.vendor?.commissionRate?.toNumber?.() || b.property?.vendor?.commissionRate || 0,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getVendorBookingById(id: string, vendorId: string) {
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        isDeleted: false,
        property: { vendorId },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            images: true,
            vendor: {
              select: {
                id: true,
                businessName: true,
                commissionRate: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            method: true,
            amount: true,
            currency: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        commissionLedger: true,
      },
    });

    if (!booking) {
      const error = new Error("Booking not found");
      (error as any).code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    const sanitized = this.sanitizeBooking(booking);
    return {
      ...sanitized,
      commissionAmount: booking.commissionLedger?.commissionAmount?.toNumber?.() || booking.commissionLedger?.commissionAmount || 0,
      vendorEarning: booking.commissionLedger?.vendorEarning?.toNumber?.() || booking.commissionLedger?.vendorEarning || 0,
      commissionRate: booking.commissionLedger?.commissionRate?.toNumber?.() || booking.commissionLedger?.commissionRate || booking.property?.vendor?.commissionRate?.toNumber?.() || booking.property?.vendor?.commissionRate || 0,
    };
  }

  async notifyBookingConfirmed(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        payment: true,
      },
    });

    if (!booking || booking.status !== "CONFIRMED" || booking.payment?.status !== "COMPLETED") {
      return;
    }

    await this.sendBookingNotifications(booking, booking.property, "CONFIRMED");
  }

  async quickBooking(data: {
    propertyId: string;
    roomId: string;
    guestName: string;
    guestPhone: string;
    guestEmail?: string;
    checkInDate: Date;
    checkOutDate: Date;
    adults: number;
    children?: number;
    totalAmount: number;
    paymentMethod: "CASH" | "CARD" | "UPI" | "RAZORPAY";
    isOnline?: boolean;
    vendorId: string;
  }) {
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    });

    if (!property || property.vendorId !== data.vendorId) {
      const error = new Error("Property not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const featureFlags = property.featureFlags as Record<string, any> | null;
    const taxPercent = featureFlags?.taxPercent || 12;

    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
    });

    if (!room || room.propertyId !== data.propertyId) {
      const error = new Error("Room not found");
      (error as any).code = ERROR_CODES.ROOM_NOT_FOUND;
      throw error;
    }

    const overlappingBookings = await prisma.booking.count({
      where: {
        roomId: data.roomId,
        status: { in: ["CONFIRMED", "PENDING", "CHECKED_IN"] },
        OR: [
          {
            checkInDate: { lt: data.checkOutDate },
            checkOutDate: { gt: data.checkInDate },
          },
        ],
      },
    });

    const availableRooms = room.totalRooms - overlappingBookings;
    if (availableRooms < 1) {
      const error = new Error("No rooms available for selected dates");
      (error as any).code = ERROR_CODES.ROOM_NOT_AVAILABLE;
      throw error;
    }

    const nights = Math.ceil(
      (data.checkOutDate.getTime() - data.checkInDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const taxRate = taxPercent / 100;
    const taxableAmount = data.totalAmount;
    const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;

    let user = await prisma.user.findFirst({
      where: { phone: data.guestPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: data.guestName,
          email: data.guestEmail || `${data.guestPhone}@guest.hosthaven`,
          phone: data.guestPhone,
          passwordHash: await hashPassword(
            Math.random().toString(36).slice(-8),
          ),
          role: "USER",
        },
      });
    }

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        userId: user.id,
        propertyId: data.propertyId,
        roomId: data.roomId,
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        adults: data.adults,
        children: data.children || 0,
        baseAmount: new Prisma.Decimal(data.totalAmount),
        taxAmount: new Prisma.Decimal(taxAmount),
        discountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(data.totalAmount + taxAmount),
        status: "PENDING",
      },
      include: {
        property: {
          include: { vendor: { include: { user: true } } },
        },
        room: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    const paymentStatus =
      data.paymentMethod === "CASH" ? "PENDING" : "COMPLETED";
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalAmount,
        currency: "INR",
        status: paymentStatus,
        method: data.paymentMethod,
      },
    });

    const bookingStatus = paymentStatus === "COMPLETED" || data.paymentMethod === "CASH" ? "CONFIRMED" : "PENDING";
    if (bookingStatus === "CONFIRMED") {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "CONFIRMED" },
      });
    }

    await adminService.calculateCommission(booking.id);

    await this.sendBookingNotifications(
      { ...booking, user, payment },
      property,
      bookingStatus,
    );

    const invoiceNights = Math.ceil(
      (booking.checkOutDate.getTime() - booking.checkInDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const invoiceData = {
      invoiceNumber: generateInvoiceId(booking.bookingNumber),
      invoiceDate: new Date().toISOString(),
      bookingDetails: {
        bookingNumber: booking.bookingNumber,
        checkIn: booking.checkInDate,
        checkOut: booking.checkOutDate,
        nights: invoiceNights,
      },
      property: {
        name: booking.property.name || "HostHaven Property",
        address: `${booking.property.address || ""}, ${booking.property.city || ""}, ${booking.property.state || ""} ${booking.property.pincode || ""}`.replace(/^, |, $/g, ""),
      },
      room: {
        name: booking.room?.name || "Standard Room",
        type: booking.room?.type || "Standard",
      },
      guest: {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      },
      pricing: {
        baseAmount: Number(booking.baseAmount) || 0,
        taxAmount: Number(booking.taxAmount) || 0,
        taxPercent: Number(booking.taxPercent) || 0,
        discountAmount: Number(booking.discountAmount) || 0,
        totalAmount: Number(booking.totalAmount) || 0,
      },
      payment: {
        status: payment.status,
        method: payment.method || "CASH",
        amount: Number(payment.amount) || 0,
      },
      vendor: {
        name: booking.property.vendor?.businessName || "HostHaven",
        email: booking.property.vendor?.user?.email || "support@hosthaven.com",
        phone: booking.property.vendor?.user?.phone || "",
        logo: booking.property.vendor?.companyLogo || "",
      },
    };

    let pdfBuffer: Buffer | null = null;
    let invoiceId: string | null = null;

    try {
      pdfBuffer = await generateInvoicePDF(invoiceData);
      invoiceId = generateInvoiceId(booking.bookingNumber);
      if (payment?.id) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { invoiceId },
        });
      }
    } catch (error) {
      logger.error({ error, bookingId: booking.id }, "Failed to generate invoice PDF");
    }

    const vendorName = booking.property.vendor?.businessName || "HostHaven";
    const vendorLocation = `${booking.property.city}, ${booking.property.state}`;
    const vendorPhone = booking.property.vendor?.user?.phone || "";
    const vendorEmail =
      booking.property.vendor?.user?.email || "support@hosthaven.com";

    const payAtProperty = Number(booking.totalAmount) - (payment ? Number(payment.amount) : 0);
    const advancePaid = payment ? Number(payment.amount) : 0;
    
    try {
      await sendEmail({
        to: user.email,
        subject: "Booking Confirmed - HostHaven",
        template: "booking-confirmed",
        data: {
          name: user.name,
          propertyName: booking.property.name,
          roomName: booking.room?.name || null,
          checkIn: booking.checkInDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
          checkOut: booking.checkOutDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
          bookingId: booking.bookingNumber,
          totalAmount: Number(booking.totalAmount),
          advancePaid: advancePaid,
          payAtProperty: payAtProperty,
          adults: booking.adults,
          children: booking.children,
          guests: true,
          vendorName,
          vendorLocation,
          vendorPhone,
          vendorEmail,
          taxAmount: booking.taxAmount ? Number(booking.taxAmount) : 0,
          taxPercent: booking.taxPercent ? Number(booking.taxPercent) : 0,
          cgstAmount: booking.taxAmount ? Number(booking.taxAmount) / 2 : 0,
          sgstAmount: booking.taxAmount ? Number(booking.taxAmount) / 2 : 0,
        },
        attachments: pdfBuffer
          ? [
              {
                filename: `invoice-${booking.bookingNumber}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ]
          : undefined,
      });
    } catch (error) {
      logger.error({ error, bookingId: booking.id }, "Failed to send booking email");
    }

    logger.info(
      { bookingId: booking.id, bookingNumber: booking.bookingNumber },
      "Quick booking created",
    );

    return {
      booking: this.sanitizeBooking({ ...booking, user, payment }),
      invoice: this.generateInvoiceData(booking, property, room, user, payment),
    };
  }

  async checkIn(bookingId: string, vendorId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking || booking.property.vendorId !== vendorId) {
      const error = new Error("Booking not found");
      (error as any).code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CHECKED_IN",
        actualCheckIn: new Date(),
      },
      include: {
        property: true,
        room: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        payment: true,
      },
    });

    await this.sendBookingNotifications(
      updated,
      updated.property,
      "CHECKED_IN",
    );

    return this.sanitizeBooking(updated);
  }

  async checkOut(bookingId: string, vendorId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking || booking.property.vendorId !== vendorId) {
      const error = new Error("Booking not found");
      (error as any).code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CHECKED_OUT",
        actualCheckOut: new Date(),
      },
      include: {
        property: true,
        room: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        payment: true,
      },
    });

    await this.sendBookingNotifications(
      updated,
      updated.property,
      "CHECKED_OUT",
    );

    // Calculate commission for the vendor
    await adminService.calculateCommission(bookingId);

    return this.sanitizeBooking(updated);
  }

  async generateInvoice(bookingId: string, vendorId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: { include: { vendor: { include: { user: true } } } },
        room: true,
        user: true,
        payment: true,
      },
    });

    if (!booking || booking.property.vendorId !== vendorId) {
      const error = new Error("Booking not found");
      (error as any).code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    return this.generateInvoiceData(
      booking,
      booking.property,
      booking.room,
      booking.user,
      booking.payment,
    );
  }

  private generateInvoiceData(
    booking: any,
    property: any,
    room: any,
    user: any,
    payment: any,
  ) {
    const nights = Math.ceil(
      (new Date(booking.checkOutDate).getTime() -
        new Date(booking.checkInDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return {
      invoiceNumber: generateInvoiceId(booking.bookingNumber),
      invoiceDate: new Date().toISOString(),
      bookingDetails: {
        bookingNumber: booking.bookingNumber,
        checkIn: booking.checkInDate,
        checkOut: booking.checkOutDate,
        nights,
      },
      property: {
        name: property.name,
        address: `${property.address}, ${property.city}, ${property.state} ${property.pincode}`,
      },
      room: {
        name: room?.name || "Standard Room",
        type: room?.type || "Standard",
      },
      guest: {
        name: user.name,
        email: user.email,
        phone: booking.guestPhone || user.phone || "",
      },
      pricing: {
        baseAmount: booking.baseAmount?.toNumber?.() || booking.baseAmount,
        taxAmount: booking.taxAmount?.toNumber?.() || booking.taxAmount,
        discountAmount:
          booking.discountAmount?.toNumber?.() || booking.discountAmount,
        totalAmount: booking.totalAmount?.toNumber?.() || booking.totalAmount,
        taxPercent: property.featureFlags?.taxPercent || 12,
      },
      payment: {
        status: payment?.status,
        method: payment?.method,
        amount: payment?.amount?.toNumber?.() || payment?.amount,
      },
      vendor: {
        name: property.vendor?.businessName || "HostHaven",
        email: property.vendor?.user?.email || "support@hosthaven.com",
        phone: property.vendor?.user?.phone || "",
        logo: property.vendor?.companyLogo || "",
      },
      guestPhone: booking.guestPhone || "",
    };
  }

  async generateInvoicePDF(bookingId: string, userId: string): Promise<Buffer> {
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [{ userId }, { property: { vendor: { userId } } }],
      },
      include: {
        property: {
          include: {
            vendor: {
              include: { user: true },
            },
          },
        },
        room: true,
        user: true,
        payment: true,
      },
    });

    if (!booking) {
      const error = new Error("Booking not found");
      (error as any).code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    const invoiceData = this.generateInvoiceData(
      booking,
      booking.property,
      booking.room,
      booking.user,
      booking.payment,
    );

    return generateInvoicePDF(invoiceData);
  }

  async getRoomInventory(vendorId: string, date: Date) {
    const properties = await prisma.property.findMany({
      where: { vendorId },
      include: {
        rooms: {
          where: { isActive: true },
          include: {
            bookings: {
              where: {
                status: { in: ["CONFIRMED", "CHECKED_IN"] },
                checkInDate: { lte: date },
                checkOutDate: { gt: date },
              },
              select: {
                id: true,
                bookingNumber: true,
                checkInDate: true,
                checkOutDate: true,
                status: true,
                user: { select: { name: true, phone: true } },
              },
            },
          },
        },
      },
    });

    const inventory = properties.map((property) => ({
      propertyId: property.id,
      propertyName: property.name,
      rooms: property.rooms.map((room) => {
        const filledRooms = room.bookings.length;
        const availableRooms = room.totalRooms - filledRooms;

        return {
          roomId: room.id,
          roomName: room.name,
          roomType: room.type,
          totalRooms: room.totalRooms,
          filledRooms,
          availableRooms,
          bookings: room.bookings.map((booking) => ({
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            guestName: booking.user.name,
            phone: booking.user.phone,
            checkIn: booking.checkInDate,
            checkOut: booking.checkOutDate,
            status: booking.status,
          })),
        };
      }),
    }));

    return inventory;
  }

  private sanitizeBooking(booking: any) {
    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      property: booking.property,
      room: booking.room,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      adults: booking.adults,
      children: booking.children,
      extraBeds: booking.extraBeds,
      baseAmount: booking.baseAmount?.toNumber?.() || booking.baseAmount,
      taxAmount: booking.taxAmount?.toNumber?.() || booking.taxAmount,
      discountAmount:
        booking.discountAmount?.toNumber?.() || booking.discountAmount,
      totalAmount: booking.totalAmount?.toNumber?.() || booking.totalAmount,
      status: booking.status,
      specialRequests: booking.specialRequests,
      guestDetails: booking.guestDetails,
      payment: booking.payment,
      paymentStatus: booking.payment?.status || "PENDING",
      user: booking.user,
      cancelledAt: booking.cancelledAt,
      cancelledBy: booking.cancelledBy,
      cancellationReason: booking.cancellationReason,
      actualCheckIn: booking.actualCheckIn,
      actualCheckOut: booking.actualCheckOut,
      isReviewed: booking.isReviewed,
      vendorNotifiedAt: booking.vendorNotifiedAt,
      vendorConfirmedAt: booking.vendorConfirmedAt,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      deletedAt: booking.deletedAt,
    };
  }
}

export const bookingsService = new BookingsService();
export default bookingsService;
