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
import { eachStayDate } from "../../utils/date.util";
import outboxService from "../../services/outbox.service";

/** Outbox event type for everything that follows a captured booking payment. */
export const BOOKING_POST_PAYMENT_EVENT = "booking.post-payment";

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

/**
 * Constant-time comparison of two hex signatures.
 *
 * `!==` on strings short-circuits at the first differing byte, which leaks how
 * much of a forged signature was correct. These are money endpoints, so the
 * comparison must not vary with the input.
 */
const signaturesMatch = (expected: string, received: unknown): boolean => {
  if (typeof received !== "string") return false;

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");

  // timingSafeEqual throws on length mismatch, so compare lengths first. The
  // expected length is fixed for a given algorithm and is not a secret.
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
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

    if (!signaturesMatch(expectedSignature, data.razorpay_signature)) {
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

    // The outbox event commits atomically with the payment: side effects
    // (commission, notifications, invoice, email) exist as durable work if
    // and only if the payment does. A failure in any of them can never fail
    // the request or be lost — the worker retries with backoff.
    const [updatedPayment, updatedBooking, outboxEvent] =
      await prisma.$transaction([
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
        prisma.outboxEvent.create({
          data: {
            type: BOOKING_POST_PAYMENT_EVENT,
            payload: { paymentId: payment.id },
          },
        }),
      ]);

    // Run immediately for snappy UX (invoice lands right away); the claim
    // inside processEvent guarantees the worker never double-runs it, and a
    // failure here simply leaves the event for the worker to retry.
    await outboxService.processEvent(outboxEvent.id);

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

  /**
   * Everything that follows a captured booking payment: commission recording,
   * confirmation notifications, invoice PDF, and the confirmation email.
   *
   * Runs as an outbox handler, so a throw here means "retry later", not a
   * failed payment. Commission recording is an upsert (idempotent); a retry
   * after a late failure may re-send the notification or email, which is the
   * accepted trade-off for never losing them.
   */
  async runBookingPostPaymentEffects(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            property: { include: { vendor: { include: { user: true } } } },
            room: true,
            user: true,
          },
        },
      },
    });

    if (!payment || !payment.booking) {
      // Nothing to do and nothing to retry.
      logger.error({ paymentId }, "Post-payment effects: payment or booking missing");
      return;
    }
    if (payment.status !== "COMPLETED") {
      logger.warn(
        { paymentId, status: payment.status },
        "Post-payment effects skipped: payment not completed",
      );
      return;
    }

    const booking = payment.booking;

    await adminService.calculateCommission(booking.id);
    await bookingsService.notifyBookingConfirmed(booking.id);

    const nights = Math.ceil(
      (new Date(booking.checkOutDate).getTime() -
        new Date(booking.checkInDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const invoiceData = {
      invoiceNumber: generateInvoiceId(booking.bookingNumber),
      invoiceDate: new Date().toISOString(),
      bookingDetails: {
        bookingNumber: booking.bookingNumber,
        checkIn: booking.checkInDate,
        checkOut: booking.checkOutDate,
        nights,
      },
      property: {
        name: booking.property.name,
        address: `${booking.property.address}, ${booking.property.city}, ${booking.property.state} ${booking.property.pincode}`,
      },
      room: {
        name: booking.room?.name || "Standard Room",
        type: booking.room?.type || "Standard",
      },
      guest: {
        name: booking.user.name,
        email: booking.user.email,
        phone: booking.user.phone || "",
      },
      pricing: {
        baseAmount: Number(booking.baseAmount),
        taxAmount: Number(booking.taxAmount),
        discountAmount: Number(booking.discountAmount),
        totalAmount: Number(booking.totalAmount),
      },
      payment: {
        status: payment.status,
        method: "RAZORPAY",
        amount: payment.amount.toNumber(),
      },
      vendor: {
        name: booking.property.vendor?.businessName || "HostHaven",
        email: booking.property.vendor?.user?.email || "support@hosthaven.com",
        phone: booking.property.vendor?.user?.phone || "",
      },
    };

    const pdfBuffer = await generateInvoicePDF(invoiceData);

    const invoiceId = generateInvoiceId(booking.bookingNumber);
    await prisma.payment.update({
      where: { id: payment.id },
      data: { invoiceId },
    });

    const vendorName = booking.property.vendor?.businessName || "HostHaven";
    const vendorLocation = `${booking.property.city}, ${booking.property.state}`;
    const vendorPhone = booking.property.vendor?.user?.phone || "";
    const vendorEmail =
      booking.property.vendor?.user?.email || "support@hosthaven.com";

    const advancePaid = Number(payment.amount);
    const payAtProperty = Number(booking.totalAmount) - advancePaid;

    await sendEmail({
      to: booking.user.email,
      subject: "Booking Confirmed - HostHaven",
      template: "booking-confirmed",
      data: {
        name: booking.user.name,
        propertyName: booking.property.name,
        roomName: booking.room?.name || null,
        checkIn: booking.checkInDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
        checkOut: booking.checkOutDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
        bookingId: booking.bookingNumber,
        totalAmount: booking.totalAmount.toNumber(),
        advancePaid,
        payAtProperty,
        adults: booking.adults,
        children: booking.children,
        guests: true,
        vendorName,
        vendorLocation,
        vendorPhone,
        vendorEmail,
        taxAmount: booking.taxAmount ? booking.taxAmount.toNumber() : 0,
        taxPercent: booking.taxPercent ? booking.taxPercent.toNumber() : 0,
        cgstAmount: booking.taxAmount ? booking.taxAmount.toNumber() / 2 : 0,
        sgstAmount: booking.taxAmount ? booking.taxAmount.toNumber() / 2 : 0,
      },
      attachments: [
        {
          filename: `invoice-${booking.bookingNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
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

    if (!signaturesMatch(expectedSignature, data.razorpay_signature)) {
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

    if (!signaturesMatch(expectedSignature, signature)) {
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
        {
          // Same outbox pattern as verifyPayment. Previously this path only
          // recorded commission — a guest whose client died before verify
          // never received an invoice or confirmation email.
          const [, , capturedEvent] = await prisma.$transaction([
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
            prisma.outboxEvent.create({
              data: {
                type: BOOKING_POST_PAYMENT_EVENT,
                payload: { paymentId: payment.id },
              },
            }),
          ]);
          await outboxService.processEvent(capturedEvent.id);
        }
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
        const failedBooking = await prisma.booking.findUnique({
          where: { id: payment.bookingId },
          include: { room: true },
        });
        const inventoryOps: any[] = [];
        if (failedBooking?.roomId && failedBooking.room) {
          const dates = eachStayDate(
            failedBooking.checkInDate,
            failedBooking.checkOutDate,
          );
          for (const date of dates) {
            inventoryOps.push(
              prisma.inventoryDay.upsert({
                where: { roomId_date: { roomId: failedBooking.roomId, date } },
                update: { availableRooms: { increment: 1 } },
                create: {
                  roomId: failedBooking.roomId,
                  date,
                  totalRooms: failedBooking.room.totalRooms,
                  availableRooms: failedBooking.room.totalRooms,
                },
              }),
            );
          }
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
          ...inventoryOps,
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

        if (refundSummary.isFullyRefunded) {
          await adminService.reverseCommission({ bookingId: payment.bookingId });
        } else {
          logger.warn(
            { paymentId: payment.id, bookingId: payment.bookingId, refundAmount },
            "Partial refund webhook — commission entry not adjusted, review manually",
          );
        }

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

  /** Owner-scoped read. The userId is mandatory: an optional scope silently
   *  meant "no filter" when undefined, which is one removed guard away from
   *  serving anyone's payment. Admin reads use adminService.getPaymentById. */
  async getPaymentById(id: string, userId: string) {
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        booking: { userId },
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

// Registered here rather than imported by the outbox service, so the outbox
// stays dependency-free of the modules it serves.
outboxService.register(BOOKING_POST_PAYMENT_EVENT, async (payload) => {
  const { paymentId } = payload as { paymentId: string };
  await paymentsService.runBookingPostPaymentEffects(paymentId);
});

export default paymentsService;
