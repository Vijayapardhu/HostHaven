import Razorpay from "razorpay";
import prisma from "../../config/database";
import { config } from "../../config";
import { ERROR_CODES } from "../../constants/error-codes";
import { logger } from "../../utils/logger.util";
import { generateBookingNumber, generateInvoiceId } from "../../utils/crypto.util";

export class ServiceBookingsService {
  async syncServiceBookingStatuses() {
    const now = new Date();
    
    const result = await prisma.serviceBooking.updateMany({
      where: {
        status: { in: ["ADVANCE_PAID", "CONFIRMED"] },
        serviceDate: { lt: now },
      },
      data: {
        status: "COMPLETED",
      },
    });

    if (result.count > 0) {
      logger.info({ count: result.count }, "Auto-completed service bookings based on service date");
    }

    return result.count;
  }

  async create(
    userId: string,
    data: {
      serviceId?: string;
      serviceName: string;
      serviceCategory?: string;
      serviceDate: Date;
      serviceTime: string;
      location: string;
      notes?: string;
      advanceAmount: number;
      totalAmount?: number;
      razorpayPaymentId?: string;
      razorpayOrderId?: string;
    },
  ) {
    if (data.serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: data.serviceId },
      });
      if (!service || !service.isActive) {
        const error = new Error("Service not found or inactive");
        (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw error;
      }
    }

    const totalAmount = data.totalAmount ?? data.advanceAmount;
    const remainingAmount = Math.max(totalAmount - data.advanceAmount, 0);

    const booking = await prisma.serviceBooking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        userId,
        serviceId: data.serviceId,
        serviceName: data.serviceName,
        serviceCategory: data.serviceCategory,
        serviceDate: data.serviceDate,
        serviceTime: data.serviceTime,
        location: data.location,
        notes: data.notes,
        advanceAmount: data.advanceAmount,
        totalAmount,
        remainingAmount,
        razorpayPaymentId: data.razorpayPaymentId,
        razorpayOrderId: data.razorpayOrderId,
        status: data.razorpayPaymentId ? "ADVANCE_PAID" : "PENDING",
      },
    });

    logger.info({ serviceBookingId: booking.id }, "Service booking created");

    return this.serialize(booking);
  }

  async getMyBookings(
    userId: string,
    filters: { page: number; limit: number; status?: string },
  ) {
    await this.syncServiceBookingStatuses();

    const skip = (filters.page - 1) * filters.limit;
    const where: any = { userId };

    if (filters.status) where.status = filters.status;

    const [bookings, total] = await Promise.all([
      prisma.serviceBooking.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.serviceBooking.count({ where }),
    ]);

    return {
      bookings: bookings.map((booking: any) => this.serialize(booking)),
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async getAllForAdmin(filters: {
    page: number;
    limit: number;
    status?: string;
  }) {
    const skip = (filters.page - 1) * filters.limit;
    const where: any = {};

    if (filters.status) where.status = filters.status;

    const [bookings, total] = await Promise.all([
      prisma.serviceBooking.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      prisma.serviceBooking.count({ where }),
    ]);

    return {
      bookings: bookings.map((booking: any) => this.serialize(booking)),
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async updateStatus(
    id: string,
    status:
      | "PENDING"
      | "ADVANCE_PAID"
      | "CONFIRMED"
      | "COMPLETED"
      | "CANCELLED",
    cancellationReason?: string,
  ) {
    const booking = await prisma.serviceBooking.findUnique({ where: { id } });

    if (!booking) {
      const error = new Error("Service booking not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const updated = await prisma.serviceBooking.update({
      where: { id },
      data: {
        status,
        adminContactedAt:
          status === "CONFIRMED" ? new Date() : booking.adminContactedAt,
        cancelledAt: status === "CANCELLED" ? new Date() : null,
        cancellationReason: status === "CANCELLED" ? cancellationReason : null,
      },
    });

    logger.info(
      { serviceBookingId: id, status },
      "Service booking status updated",
    );

    return this.serialize(updated);
  }

  async getByIdForAdmin(id: string) {
    const booking = await prisma.serviceBooking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!booking) {
      const error = new Error("Service booking not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return this.serialize(booking);
  }

  async cancelMyBooking(id: string, userId: string) {
    const booking = await prisma.serviceBooking.findFirst({
      where: { id, userId },
    });

    if (!booking) {
      const error = new Error("Service booking not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    if (booking.status === "CANCELLED") {
      const error = new Error("Booking is already cancelled");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    if (booking.status === "COMPLETED") {
      const error = new Error("Cannot cancel a completed booking");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    // Process refund if payment was made
    if (booking.razorpayPaymentId && booking.advanceAmount.gt(0)) {
      const razorpayClient = new Razorpay({
        key_id: config.razorpay.keyId,
        key_secret: config.razorpay.keySecret,
      });

      await razorpayClient.payments.refund(
        booking.razorpayPaymentId,
        {
          amount: Math.round(Number(booking.advanceAmount) * 100),
          speed: "normal",
          notes: { reason: "Service booking cancelled by user" },
        },
      );
    }

    const updated = await prisma.serviceBooking.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: "Cancelled by user",
      },
    });

    logger.info({ serviceBookingId: id }, "Service booking cancelled by user");

    return this.serialize(updated);
  }

  async refund(id: string, amount: number, reason?: string) {
    const booking = await prisma.serviceBooking.findUnique({ where: { id } });

    if (!booking) {
      const error = new Error("Service booking not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    if (booking.razorpayPaymentId) {
      try {
        const razorpayClient = new Razorpay({
          key_id: config.razorpay.keyId,
          key_secret: config.razorpay.keySecret,
        });

        await razorpayClient.payments.refund(
          booking.razorpayPaymentId,
          {
            amount: Math.round(amount * 100),
            speed: "normal",
            notes: { reason: reason || "Service booking cancelled" },
          },
        );
      } catch (refundError) {
        logger.error({ error: refundError, serviceBookingId: id }, "Razorpay refund failed for service booking");
      }
    }

    const updated = await prisma.serviceBooking.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    logger.info(
      { serviceBookingId: id, amount },
      "Service booking refund processed",
    );

    return {
      booking: this.serialize(updated),
      message: "Refund processed",
    };
  }

  async getMyBookingById(id: string, userId: string) {
    const booking = await prisma.serviceBooking.findFirst({
      where: { id, userId },
    });

    if (!booking) {
      const error = new Error("Service booking not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return this.serialize(booking);
  }

  async generateInvoice(id: string, userId: string) {
    const booking = await prisma.serviceBooking.findFirst({
      where: { id, userId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!booking) {
      const error = new Error("Service booking not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const invoiceData = {
      invoiceNumber: generateInvoiceId(booking.bookingNumber),
      bookingNumber: booking.bookingNumber,
      date: booking.createdAt,
      customer: {
        name: booking.user?.name || "Customer",
        email: booking.user?.email || "",
        phone: booking.user?.phone || "",
      },
      service: {
        name: booking.serviceName,
        category: booking.serviceCategory || "",
        date: booking.serviceDate,
        time: booking.serviceTime,
        location: booking.location,
      },
      pricing: {
        advancePaid: Number(booking.advanceAmount),
        totalAmount: Number(booking.totalAmount),
        remainingAmount: Number(booking.remainingAmount),
      },
      status: booking.status,
    };

    const { generateServiceBookingInvoicePDF } = await import("../../services/pdf-invoice.service.js");
    try {
      const pdf = await generateServiceBookingInvoicePDF(invoiceData);
      logger.info({ invoiceId: invoiceData.invoiceNumber, size: pdf.length }, "Invoice generated successfully");
      return pdf;
    } catch (pdfError) {
      logger.error({ pdfError, invoiceData }, "Failed to generate PDF");
      throw pdfError;
    }
  }

  private serialize(booking: any) {
    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      serviceBookingNumber: booking.bookingNumber,
      user: booking.user,
      serviceId: booking.serviceId,
      serviceName: booking.serviceName,
      serviceCategory: booking.serviceCategory,
      serviceDate: booking.serviceDate,
      serviceTime: booking.serviceTime,
      location: booking.location,
      notes: booking.notes,
      advanceAmount:
        booking.advanceAmount?.toNumber?.() ?? booking.advanceAmount,
      totalAmount: booking.totalAmount?.toNumber?.() ?? booking.totalAmount,
      remainingAmount:
        booking.remainingAmount?.toNumber?.() ?? booking.remainingAmount,
      razorpayPaymentId: booking.razorpayPaymentId,
      paymentStatus: booking.razorpayPaymentId ? "COMPLETED" : "PENDING",
      status: booking.status,
      adminContactedAt: booking.adminContactedAt,
      cancelledAt: booking.cancelledAt,
      cancellationReason: booking.cancellationReason,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }
}

export const serviceBookingsService = new ServiceBookingsService();
export default serviceBookingsService;
