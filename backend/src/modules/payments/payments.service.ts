import Razorpay from "razorpay";
import crypto from "crypto";
import prisma from "../../config/database";
import { config } from "../../config";
import { logger } from "../../utils/logger.util";
import { ERROR_CODES } from "../../constants/error-codes";
import { sendEmail } from "../../services/email.service";
import { generateInvoicePDF } from "../../services/pdf-invoice.service";
import notificationsService from "../notifications/notifications.service";
import { webPushService } from "../../services/webpush.service";
import { PaymentMethod } from "@prisma/client";
import { generateInvoiceId } from "../../utils/crypto.util";

const validPaymentMethods: Record<string, PaymentMethod> = {
  CARD: 'CARD',
  UPI: 'UPI',
  NETBANKING: 'NETBANKING',
  WALLET: 'WALLET',
  CASH: 'CASH',
};

const mapRazorpayMethod = (method?: string): PaymentMethod => {
  if (!method) return 'CASH';
  const normalized = method.toUpperCase();
  return validPaymentMethods[normalized] || 'CASH';
};
import { Prisma } from "@prisma/client";
import adminService from "../admin/admin.service";
import bookingsService from "../bookings/bookings.service";

const ensureRazorpayCredentials = () => {
  if (!config.razorpay.keyId || !config.razorpay.keySecret) {
    const error = new Error(
      "Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
    (error as any).code = ERROR_CODES.PAYMENT_FAILED;
    throw error;
  }
};

let razorpayClient: Razorpay | null = null;

const getRazorpayClient = () => {
  if (!razorpayClient) {
    ensureRazorpayCredentials();
    razorpayClient = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }

  return razorpayClient;
};

export class PaymentsService {
  private getPaymentStatusAfterRefund(totalRefunded: number, paymentAmount: number): 'REFUNDED' | 'PARTIALLY_REFUNDED' {
    return totalRefunded >= paymentAmount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
  }

  private calculateRefundedTotal(paymentAmount: number, refunds: Array<{ amount: Prisma.Decimal | { toNumber?: () => number } | number }>, nextRefundAmount = 0) {
    const totalRefunded = refunds.reduce((sum, refund) => {
      const amount = typeof refund.amount === 'number'
        ? refund.amount
        : (refund.amount as any)?.toNumber?.() ?? 0;
      return sum + amount;
    }, 0) + nextRefundAmount;

    return {
      totalRefunded,
      nextPaymentStatus: this.getPaymentStatusAfterRefund(totalRefunded, paymentAmount),
      isFullyRefunded: totalRefunded >= paymentAmount,
    };
  }

  async createOrder(bookingId: string, userId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId },
      include: { property: true },
    });

    if (!booking) {
      const error = new Error("Booking not found");
      (error as any).code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    if (booking.status !== "PENDING") {
      const error = new Error("Booking is not pending payment");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment?.razorpayOrderId) {
      return {
        orderId: existingPayment.razorpayOrderId,
        amount: existingPayment.amount.toNumber(),
        currency: existingPayment.currency,
        keyId: config.razorpay.keyId,
      };
    }

    const amount = booking.totalAmount.toNumber() * 100;

    const order = await getRazorpayClient().orders.create({
      amount,
      currency: "INR",
      receipt: booking.bookingNumber,
      notes: {
        bookingId: booking.id,
        propertyName: booking.property.name,
      },
    });

    await prisma.payment.update({
      where: { bookingId },
      data: {
        razorpayOrderId: order.id,
        status: "PROCESSING",
      },
    });

    logger.info({ bookingId, orderId: order.id }, "Payment order created");

    return {
      orderId: order.id,
      amount: amount / 100,
      currency: "INR",
      keyId: config.razorpay.keyId,
    };
  }

  async createServiceOrder(serviceBookingId: string, userId: string) {
    const booking = await prisma.serviceBooking.findFirst({
      where: { id: serviceBookingId, userId },
    });

    if (!booking) {
      const error = new Error("Service booking not found");
      (error as any).code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    if (booking.status !== "PENDING") {
      const error = new Error("Service booking is not pending payment");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    if (booking.razorpayOrderId) {
      return {
        orderId: booking.razorpayOrderId,
        amount: booking.advanceAmount.toNumber(),
        currency: "INR",
        keyId: config.razorpay.keyId,
      };
    }

    const amount = booking.advanceAmount.toNumber() * 100;

    const order = await getRazorpayClient().orders.create({
      amount,
      currency: "INR",
      receipt: booking.bookingNumber,
      notes: {
        serviceBookingId: booking.id,
        serviceName: booking.serviceName,
      },
    });

    await prisma.serviceBooking.update({
      where: { id: serviceBookingId },
      data: {
        razorpayOrderId: order.id,
      },
    });

    logger.info(
      { serviceBookingId, orderId: order.id },
      "Service payment order created",
    );

    return {
      orderId: order.id,
      amount: amount / 100,
      currency: "INR",
      keyId: config.razorpay.keyId,
    };
  }

  async createVendorOrder(bookingId: string, vendorId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId },
      include: { property: true, payment: true },
    });

    if (!booking || booking.property.vendorId !== vendorId) {
      const error = new Error("Booking not found");
      (error as any).code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    const amount = booking.totalAmount.toNumber() * 100;

    const order = await getRazorpayClient().orders.create({
      amount,
      currency: "INR",
      receipt: booking.bookingNumber,
      notes: {
        bookingId: booking.id,
        propertyName: booking.property.name,
      },
    });

    if (booking.payment) {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          razorpayOrderId: order.id,
          status: "PROCESSING",
        },
      });
    }

    logger.info(
      { bookingId, orderId: order.id },
      "Vendor payment order created",
    );

    return {
      orderId: order.id,
      amount: amount / 100,
      currency: "INR",
      keyId: config.razorpay.keyId,
      bookingId: booking.id,
    };
  }

  async verifyPayment(
    data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
    userId: string,
  ) {
    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId: data.razorpay_order_id },
      include: {
        booking: {
          include: {
            property: {
              include: { vendor: { include: { user: true } } },
            },
            user: true,
            room: true,
          },
        },
      },
    });

    if (!payment) {
      const error = new Error("Payment not found");
      (error as any).code = ERROR_CODES.PAYMENT_FAILED;
      throw error;
    }

    if (payment.booking.userId !== userId) {
      const error = new Error("Unauthorized");
      (error as any).code = ERROR_CODES.UNAUTHORIZED;
      throw error;
    }

    const body = data.razorpay_order_id + "|" + data.razorpay_payment_id;
    ensureRazorpayCredentials();
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpay.keySecret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== data.razorpay_signature) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          errorCode: "SIGNATURE_MISMATCH",
          errorDesc: "Payment signature verification failed",
        },
      });

      const error = new Error("Payment verification failed");
      (error as any).code = ERROR_CODES.PAYMENT_FAILED;
      throw error;
    }

    if (
      payment.status === "COMPLETED" &&
      payment.booking.status === "CONFIRMED" &&
      payment.razorpayPaymentId === data.razorpay_payment_id
    ) {
      logger.info(
        { paymentId: payment.id, bookingId: payment.bookingId },
        "Duplicate payment verification ignored",
      );

      return {
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount.toNumber(),
        },
        booking: {
          id: payment.booking.id,
          status: payment.booking.status,
          bookingNumber: payment.booking.bookingNumber,
        },
      };
    }

    const [updatedPayment, updatedBooking] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature,
          method: "RAZORPAY",
        },
      }),
      prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" },
      }),
    ]);

    await adminService.calculateCommission(updatedBooking.id);

    await bookingsService.notifyBookingConfirmed(updatedBooking.id);

    const nights = Math.ceil(
      (new Date(updatedBooking.checkOutDate).getTime() -
        new Date(updatedBooking.checkInDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const invoiceData = {
      invoiceNumber: generateInvoiceId(updatedBooking.bookingNumber),
      invoiceDate: new Date().toISOString(),
      bookingDetails: {
        bookingNumber: updatedBooking.bookingNumber,
        checkIn: updatedBooking.checkInDate,
        checkOut: updatedBooking.checkOutDate,
        nights,
      },
      property: {
        name: payment.booking.property.name,
        address: `${payment.booking.property.address}, ${payment.booking.property.city}, ${payment.booking.property.state} ${payment.booking.property.pincode}`,
      },
      room: {
        name: payment.booking.room?.name || "Standard Room",
        type: payment.booking.room?.type || "Standard",
      },
      guest: {
        name: payment.booking.user.name,
        email: payment.booking.user.email,
        phone: payment.booking.user.phone || "",
      },
      pricing: {
        baseAmount: Number(updatedBooking.baseAmount),
        taxAmount: Number(updatedBooking.taxAmount),
        discountAmount: Number(updatedBooking.discountAmount),
        totalAmount: Number(updatedBooking.totalAmount),
      },
      payment: {
        status: updatedPayment.status,
        method: "RAZORPAY",
        amount: updatedPayment.amount.toNumber(),
      },
      vendor: {
        name: payment.booking.property.vendor?.businessName || "HostHaven",
        email:
          payment.booking.property.vendor?.user?.email ||
          "support@hosthaven.com",
        phone: payment.booking.property.vendor?.user?.phone || "",
      },
    };

    const pdfBuffer = await generateInvoicePDF(invoiceData);

    const invoiceId = generateInvoiceId(updatedBooking.bookingNumber);
    await prisma.payment.update({
      where: { id: payment.id },
      data: { invoiceId },
    });

    const vendorName =
      payment.booking.property.vendor?.businessName || "HostHaven";
    const vendorLocation = `${payment.booking.property.city}, ${payment.booking.property.state}`;
    const vendorPhone = payment.booking.property.vendor?.user?.phone || "";
    const vendorEmail =
      payment.booking.property.vendor?.user?.email || "support@hosthaven.com";

    const advancePaid = Number(payment.amount);
    const payAtProperty = Number(updatedBooking.totalAmount) - advancePaid;
    
    await sendEmail({
      to: payment.booking.user.email,
      subject: "Booking Confirmed - HostHaven",
      template: "booking-confirmed",
      data: {
        name: payment.booking.user.name,
        propertyName: payment.booking.property.name,
        roomName: payment.booking.room?.name || null,
        checkIn: updatedBooking.checkInDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        checkOut: updatedBooking.checkOutDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        bookingId: updatedBooking.bookingNumber,
        totalAmount: updatedBooking.totalAmount.toNumber(),
        advancePaid: advancePaid,
        payAtProperty: payAtProperty,
        adults: updatedBooking.adults,
        children: updatedBooking.children,
        guests: true,
        vendorName,
        vendorLocation,
        vendorPhone,
        vendorEmail,
        taxAmount: updatedBooking.taxAmount ? updatedBooking.taxAmount.toNumber() : 0,
        taxPercent: updatedBooking.taxPercent ? updatedBooking.taxPercent.toNumber() : 0,
        cgstAmount: updatedBooking.taxAmount ? updatedBooking.taxAmount.toNumber() / 2 : 0,
        sgstAmount: updatedBooking.taxAmount ? updatedBooking.taxAmount.toNumber() / 2 : 0,
      },
      attachments: [
        {
          filename: `invoice-${updatedBooking.bookingNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    logger.info(
      { paymentId: payment.id, bookingId: payment.bookingId },
      "Payment verified",
    );

    return {
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        amount: updatedPayment.amount.toNumber(),
      },
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        bookingNumber: updatedBooking.bookingNumber,
      },
    };
  }

  async verifyServicePayment(
    data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      serviceBookingId: string;
    },
    userId: string,
  ) {
    const booking = await prisma.serviceBooking.findFirst({
      where: { razorpayOrderId: data.razorpay_order_id },
      include: { user: true },
    });

    if (!booking) {
      const error = new Error("Service booking not found");
      (error as any).code = ERROR_CODES.PAYMENT_FAILED;
      throw error;
    }

    if (booking.userId !== userId) {
      const error = new Error("Unauthorized");
      (error as any).code = ERROR_CODES.UNAUTHORIZED;
      throw error;
    }

    const body = data.razorpay_order_id + "|" + data.razorpay_payment_id;
    ensureRazorpayCredentials();
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpay.keySecret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== data.razorpay_signature) {
      const error = new Error("Payment verification failed");
      (error as any).code = ERROR_CODES.PAYMENT_FAILED;
      throw error;
    }

    const updatedBooking = await prisma.serviceBooking.update({
      where: { id: booking.id },
      data: {
        status: "ADVANCE_PAID",
        razorpayPaymentId: data.razorpay_payment_id,
      },
    });

    let pdfBuffer = null;
    try {
      const { generateServiceBookingInvoicePDF } = await import("../../services/pdf-invoice.service.js");
      const invoiceData = {
        invoiceNumber: generateInvoiceId(booking.bookingNumber),
        bookingNumber: booking.bookingNumber,
        date: updatedBooking.createdAt,
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
          advancePaid: Number(updatedBooking.advanceAmount),
          totalAmount: Number(updatedBooking.totalAmount),
          remainingAmount: Number(updatedBooking.remainingAmount),
        },
        status: updatedBooking.status,
      };
      pdfBuffer = await generateServiceBookingInvoicePDF(invoiceData);
    } catch (pdfError) {
      logger.error({ pdfError, serviceBookingId: booking.id }, "Failed to generate service booking invoice PDF");
    }

    try {
      if (booking.user.email) {
        await sendEmail({
          to: booking.user.email,
          subject: "Service Booking Confirmed - HostHaven",
          template: "service-booking-confirmed",
          data: {
            name: booking.user.name,
            bookingId: booking.bookingNumber,
            serviceName: booking.serviceName,
            serviceCategory: booking.serviceCategory,
            serviceDate: booking.serviceDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
            serviceTime: booking.serviceTime,
            location: booking.location,
            notes: booking.notes,
            advanceAmount: Number(updatedBooking.advanceAmount),
            totalAmount: Number(updatedBooking.totalAmount),
            remainingAmount: Number(updatedBooking.remainingAmount),
            paymentStatus: "ADVANCE_PAID",
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
        }).catch((err) =>
          logger.error({ err }, "Failed to send service booking email"),
        );
      }
    } catch (e) {
      logger.error({ error: e }, "Failed to send service booking email");
    }

    logger.info({ serviceBookingId: booking.id }, "Service payment verified");

    return {
      success: true,
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        bookingNumber: updatedBooking.bookingNumber,
      },
    };
  }

  async sendPaymentNotifications(payment: any, booking: any, action: string) {
    try {
      const property = await prisma.property.findUnique({
        where: { id: booking.propertyId },
      });

      if (!property) return;

      const user = await prisma.user.findUnique({
        where: { id: booking.userId },
      });

      let userTitle = "";
      let userMessage = "";
      let vendorTitle = "";
      let vendorMessage = "";

      switch (action) {
        case "COMPLETED":
          return;
        case "REFUNDED":
          userTitle = "Refund Processed";
          userMessage = `Your refund of ₹${payment.amount} for booking ${booking.bookingNumber} has been processed.`;
          vendorTitle = "Refund Processed";
          vendorMessage = `Refund of ₹${payment.amount} processed for booking ${booking.bookingNumber}`;
          break;
        case "FAILED":
          userTitle = "Payment Failed";
          userMessage = `Your payment for booking ${booking.bookingNumber} failed. Please try again.`;
          vendorTitle = "Payment Failed";
          vendorMessage = `Payment failed for booking ${booking.bookingNumber} at ${property.name}`;
          break;
      }

      // Send user notification
      if (user) {
        await notificationsService.create({
          userId: user.id,
          type: `PAYMENT_${action}`,
          title: userTitle,
          message: userMessage,
          data: {
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            paymentId: payment.id,
            amount: payment.amount,
          },
        });

        await webPushService.sendNotification(user.id, {
          title: userTitle,
          body: userMessage,
          tag: `payment-${payment.id}`,
          data: {
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            paymentId: payment.id,
          },
        });
      }

      // Send vendor notification
      if (property.vendorId) {
        const vendor = await prisma.vendor.findUnique({
          where: { id: property.vendorId },
          select: { userId: true },
        });

        if (vendor?.userId) {
          await notificationsService.create({
            userId: vendor.userId,
            type: `PAYMENT_${action}`,
            title: vendorTitle,
            message: vendorMessage,
            data: {
              bookingId: booking.id,
              bookingNumber: booking.bookingNumber,
              paymentId: payment.id,
              amount: payment.amount,
            },
          });

          await webPushService.sendNotification(vendor.userId, {
            title: vendorTitle,
            body: vendorMessage,
            tag: `payment-${payment.id}`,
            data: {
              bookingId: booking.id,
              bookingNumber: booking.bookingNumber,
              paymentId: payment.id,
            },
          });
        }
      }
    } catch (error) {
      logger.error({ error }, "Failed to send payment notifications");
    }
  }

  async handleWebhook(rawBody: string, payload: any, signature: string) {
    const webhookSecret = config.razorpay.webhookSecret;
    if (!webhookSecret) {
      logger.error('Razorpay webhook secret not configured');
      return { success: false, error: 'Configuration error' };
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      logger.error({ signature }, "Invalid webhook signature");
      return { success: false };
    }

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const refundEntity = payload.payload?.refund?.entity;

    if (!paymentEntity && !refundEntity) {
      return { success: true };
    }

    const orderId = paymentEntity?.order_id || refundEntity?.notes?.order_id;

    const paymentLookup = refundEntity?.payment_id
      ? {
          OR: [
            { razorpayPaymentId: refundEntity.payment_id },
            ...(orderId ? [{ razorpayOrderId: orderId }] : []),
          ],
        }
      : orderId
        ? { razorpayOrderId: orderId }
        : undefined;

    if (!paymentLookup && !orderId) {
      logger.info({ event }, 'Webhook skipped due to missing payment reference');
      return { success: true };
    }

    const payment = await prisma.payment.findFirst({
      where: paymentLookup,
      include: { refunds: true },
    });

    if (!payment) {
      const serviceBooking = await prisma.serviceBooking.findFirst({
        where: { razorpayOrderId: orderId },
      });

      if (serviceBooking) {
        switch (event) {
          case "payment.captured":
            if (
              serviceBooking.status === "ADVANCE_PAID" &&
              serviceBooking.razorpayPaymentId === paymentEntity.id
            ) {
              logger.info(
                { event, orderId, serviceBookingId: serviceBooking.id },
                "Duplicate service payment webhook ignored",
              );
              return { success: true };
            }
            await prisma.serviceBooking.update({
              where: { id: serviceBooking.id },
              data: {
                status: "ADVANCE_PAID",
                razorpayPaymentId: paymentEntity.id,
              },
            });
            break;
          case "payment.failed":
            if (serviceBooking.status === "CANCELLED") {
              logger.info(
                { event, orderId, serviceBookingId: serviceBooking.id },
                "Duplicate service payment failure webhook ignored",
              );
              return { success: true };
            }
            await prisma.serviceBooking.update({
              where: { id: serviceBooking.id },
              data: { status: "CANCELLED" },
            });
            break;
        }
      }
      return { success: true };
    }

    switch (event) {
      case "payment.captured":
        if (
          ["COMPLETED", "PARTIALLY_REFUNDED", "REFUNDED"].includes(payment.status) &&
          payment.razorpayPaymentId === paymentEntity.id
        ) {
          logger.info({ event, orderId }, "Duplicate payment.captured webhook ignored");
          return { success: true };
        }
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "COMPLETED",
              razorpayPaymentId: paymentEntity.id,
              method: mapRazorpayMethod(paymentEntity.method),
            },
          }),
          prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: "CONFIRMED" },
          }),
        ]);
        await adminService.calculateCommission(payment.bookingId);
        await bookingsService.notifyBookingConfirmed(payment.bookingId);
        break;

      case "payment.failed":
        if (["COMPLETED", "PARTIALLY_REFUNDED", "REFUNDED"].includes(payment.status)) {
          logger.info({ event, orderId }, "Ignored payment.failed after successful capture/refund state");
          return { success: true };
        }
        if (payment.status === "FAILED") {
          logger.info({ event, orderId }, "Duplicate payment.failed webhook ignored");
          return { success: true };
        }
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "FAILED",
              errorCode: paymentEntity.error_code,
              errorDesc: paymentEntity.error_description,
            },
          }),
          prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: "CANCELLED" },
          }),
        ]);
        break;

      case "refund.created":
      case "refund.processed":
        if (!refundEntity?.id) {
          logger.info({ event, orderId }, 'Refund webhook ignored due to missing refund entity');
          return { success: true };
        }

        const existingRefund = await prisma.refund.findFirst({
          where: {
            paymentId: payment.id,
            razorpayRefundId: refundEntity.id,
          },
        });

        if (existingRefund) {
          if (event === 'refund.processed' && existingRefund.status !== 'processed') {
            await prisma.refund.update({
              where: { id: existingRefund.id },
              data: { status: 'processed' },
            });
          }

          logger.info(
            { event, orderId, refundId: refundEntity.id },
            "Duplicate refund webhook ignored",
          );
          return { success: true };
        }

        const refundAmount = (refundEntity.amount ?? 0) / 100;
        const refundSummary = this.calculateRefundedTotal(
          payment.amount.toNumber(),
          payment.refunds,
          refundAmount,
        );

        const [updatedPayment, updatedBooking] = await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: refundSummary.nextPaymentStatus,
              refundedAt: new Date(),
              refundId: refundEntity.id,
            },
          }),
          prisma.booking.update({
            where: { id: payment.bookingId },
            data: refundSummary.isFullyRefunded
              ? { status: "REFUNDED" }
              : {},
          }),
          prisma.refund.create({
            data: {
              paymentId: payment.id,
              amount: refundAmount,
              reason: refundEntity.notes?.reason || undefined,
              status: event === "refund.processed" ? "processed" : "initiated",
              razorpayRefundId: refundEntity.id,
            },
          }),
        ]);

        await this.sendPaymentNotifications(
          updatedPayment,
          updatedBooking,
          "REFUNDED",
        );
        break;

      default:
        logger.info({ event, orderId }, "Unhandled webhook event ignored");
        break;
    }

    logger.info({ event, orderId }, "Webhook processed");
    return { success: true };
  }

  async getPaymentById(id: string, userId?: string) {
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        ...(userId ? { booking: { userId } } : {}),
      },
      include: {
        booking: {
          include: { property: true },
        },
      },
    });

    if (!payment) {
      const error = new Error("Payment not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const refunds = await prisma.refund.findMany({
      where: { paymentId: payment.id },
      orderBy: { createdAt: "desc" },
    });

    return {
      id: payment.id,
      amount: payment.amount.toNumber(),
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      receiptUrl: payment.receiptUrl,
      refundedAt: payment.refundedAt,
      createdAt: payment.createdAt,
      refunds: refunds.map((refund: any) => ({
        id: refund.id,
        amount: refund.amount.toNumber(),
        reason: refund.reason,
        status: refund.status,
        createdAt: refund.createdAt,
      })),
      booking: {
        id: payment.booking.id,
        bookingNumber: payment.booking.bookingNumber,
        status: payment.booking.status,
        property: payment.booking.property,
      },
    };
  }
}

export const paymentsService = new PaymentsService();
export default paymentsService;
