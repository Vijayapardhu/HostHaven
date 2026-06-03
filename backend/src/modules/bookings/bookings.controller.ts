import { FastifyRequest, FastifyReply } from "fastify";
import bookingsService from "./bookings.service";
import { sendSuccess, sendError } from "../../utils/response.util";
import { ERROR_CODES } from "../../constants/error-codes";
import { logger } from "../../utils/logger.util";
import {
  createBookingSchema,
  cancelBookingSchema,
  bookingFilterSchema,
  bookingIdSchema,
  checkPriceSchema,
} from "./bookings.schema";

export const BookingsController = {
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createBookingSchema.parse(request.body);
      const userId = (request as any).user.id;

      const result = await bookingsService.create({
        ...data,
        checkInDate: new Date(data.checkInDate),
        checkOutDate: new Date(data.checkOutDate),
        userId,
      });

      return sendSuccess(reply, result, 201);
    } catch (error: any) {
      logger.error({ error }, "Create booking failed");

      if (error.code === ERROR_CODES.ROOM_NOT_AVAILABLE) {
        return sendError(reply, error.code, "Sorry, these rooms are no longer available for your selected dates. Please choose different dates or room type.", 409);
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, "The property or room you're looking for could not be found.", 404);
      }
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Please check your booking details and try again.",
          400,
        );
      }

      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Unable to complete your booking. Please try again.",
        500,
      );
    }
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = bookingIdSchema.parse(request.params);
      const userId = (request as any).user.id;

      const booking = await bookingsService.getById(id, userId);
      return sendSuccess(reply, booking);
    } catch (error: any) {
      logger.error({ error }, "Get booking failed");

      if (error.code === ERROR_CODES.BOOKING_NOT_FOUND) {
        return sendError(reply, error.code, "We couldn't find this booking. It may have been cancelled or doesn't exist.", 404);
      }

      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Unable to load booking details. Please try again.",
        500,
      );
    }
  },

  async getUserBookings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = bookingFilterSchema.parse(request.query);
      const userId = (request as any).user.id;

      const result = await bookingsService.getUserBookings(userId, {
        page: query.page,
        limit: query.limit,
        status: query.status,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      });

      return sendSuccess(reply, result.bookings, 200, result.meta);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid input data",
          400,
        );
      }
      logger.error({ error }, "Get user bookings failed");
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to fetch bookings",
        500,
      );
    }
  },

  async cancel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = bookingIdSchema.parse(request.params);
      const data = cancelBookingSchema.parse(request.body ?? {});
      const userId = (request as any).user.id;

      const result = await bookingsService.cancel(id, userId, data.reason);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Cancel booking failed");

      if (error.code === ERROR_CODES.BOOKING_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.code === ERROR_CODES.BOOKING_CANNOT_CANCEL) {
        return sendError(reply, error.code, error.message, 400);
      }

      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to cancel booking",
        500,
      );
    }
  },

  async checkPrice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = checkPriceSchema.parse(request.body);

      const result = await bookingsService.checkPrice({
        ...data,
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
      });

      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Check price failed");

      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }

      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to calculate price",
        500,
      );
    }
  },

  async getVendorBookings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = bookingFilterSchema.parse(request.query);
      const user = (request as any).user;

      const result = await bookingsService.getVendorBookings(user.vendorId, {
        page: query.page,
        limit: query.limit,
        status: query.status,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      });

      return sendSuccess(reply, result.bookings, 200, result.meta);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid input data",
          400,
        );
      }
      logger.error({ error }, "Get vendor bookings failed");
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to fetch bookings",
        500,
      );
    }
  },

  async getVendorBookingById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = bookingIdSchema.parse(request.params);
      const user = (request as any).user;

      const booking = await bookingsService.getVendorBookingById(
        id,
        user.vendorId,
      );
      return sendSuccess(reply, booking);
    } catch (error: any) {
      logger.error({ error }, "Get vendor booking failed");

      if (error.code === ERROR_CODES.BOOKING_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }

      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to fetch booking",
        500,
      );
    }
  },

  async cancelVendor(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = bookingIdSchema.parse(request.params);
      const data = cancelBookingSchema.parse(request.body ?? {});
      const user = (request as any).user;

      const result = await bookingsService.cancel(
        id,
        user.id,
        data.reason,
        user.vendorId,
      );
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Vendor cancel booking failed");

      if (error.code === ERROR_CODES.BOOKING_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.code === ERROR_CODES.BOOKING_CANNOT_CANCEL) {
        return sendError(reply, error.code, error.message, 400);
      }

      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to cancel booking",
        500,
      );
    }
  },

  async reschedule(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = bookingIdSchema.parse(request.params);
      const data = request.body as {
        newCheckInDate: string;
        newCheckOutDate: string;
      };
      const user = (request as any).user;

      const result = await bookingsService.reschedule(
        id,
        user.id,
        data.newCheckInDate,
        data.newCheckOutDate,
        user.vendorId,
      );
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Reschedule booking failed");

      if (error.code === ERROR_CODES.BOOKING_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.code === ERROR_CODES.FORBIDDEN) {
        return sendError(reply, error.code, error.message, 403);
      }
      if (error.code === ERROR_CODES.ROOM_NOT_AVAILABLE) {
        return sendError(reply, error.code, error.message, 400);
      }
      if (error.code === ERROR_CODES.VALIDATION_ERROR) {
        return sendError(reply, error.code, error.message, 400);
      }

      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to reschedule booking",
        500,
      );
    }
  },

  async modifyBooking(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = bookingIdSchema.parse(request.params);
      const data = request.body as {
        guests?: number;
        extraBeds?: number;
        specialRequests?: string;
        guestDetails?: any;
      };
      const user = (request as any).user;

      const result = await bookingsService.modifyBooking(
        id,
        user.id,
        data,
        user.vendorId,
      );
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Modify booking failed");

      if (error.code === ERROR_CODES.BOOKING_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.code === ERROR_CODES.FORBIDDEN) {
        return sendError(reply, error.code, error.message, 403);
      }
      if (error.code === ERROR_CODES.VALIDATION_ERROR) {
        return sendError(reply, error.code, error.message, 400);
      }

      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to modify booking",
        500,
      );
    }
  },

  async quickBooking(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const data = request.body as {
        propertyId: string;
        roomId: string;
        guestName: string;
        guestPhone: string;
        guestEmail?: string;
        checkInDate: string;
        checkOutDate: string;
        adults: number;
        children?: number;
        totalAmount: number;
        paymentMethod: "CASH" | "CARD" | "UPI" | "RAZORPAY";
        isOnline?: boolean;
      };

      const result = await bookingsService.quickBooking({
        ...data,
        checkInDate: new Date(data.checkInDate),
        checkOutDate: new Date(data.checkOutDate),
        vendorId: user.vendorId,
      });

      return sendSuccess(reply, result, 201);
    } catch (error: any) {
      logger.error(
        { error: error?.message || String(error), stack: error?.stack, code: error?.code },
        "Quick booking failed",
      );
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid input data",
          400,
        );
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to create booking",
        500,
      );
    }
  },

  async checkIn(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = bookingIdSchema.parse(request.params);
      const user = (request as any).user;

      const result = await bookingsService.checkIn(id, user.vendorId);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Check in failed");
      if (error.code === ERROR_CODES.BOOKING_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to check in",
        500,
      );
    }
  },

  async checkOut(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = bookingIdSchema.parse(request.params);
      const user = (request as any).user;

      const result = await bookingsService.checkOut(id, user.vendorId);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Check out failed");
      if (error.code === ERROR_CODES.BOOKING_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to check out",
        500,
      );
    }
  },

  async generateInvoice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = bookingIdSchema.parse(request.params);
      const user = (request as any).user;

      const invoice = await bookingsService.generateInvoice(id, user.vendorId);
      return sendSuccess(reply, invoice);
    } catch (error: any) {
      logger.error({ error }, "Generate invoice failed");
      if (error.code === ERROR_CODES.BOOKING_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to generate invoice",
        500,
      );
    }
  },

  async downloadInvoicePDF(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = bookingIdSchema.parse(request.params);
      const user = (request as any).user;

      const pdfBuffer = await bookingsService.generateInvoicePDF(id, user.id);

      reply.header("Content-Type", "application/pdf");
      reply.header(
        "Content-Disposition",
        `attachment; filename="invoice-${id}.pdf"`,
      );

      return reply.send(pdfBuffer);
    } catch (error: any) {
      logger.error({ error }, "Download invoice PDF failed");
      if (error.code === ERROR_CODES.BOOKING_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to download invoice",
        500,
      );
    }
  },

  async getRoomInventory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { date } = request.query as { date?: string };
      const targetDate = date ? new Date(date) : new Date();

      const inventory = await bookingsService.getRoomInventory(
        user.vendorId,
        targetDate,
      );
      return sendSuccess(reply, inventory);
    } catch (error: any) {
      logger.error({ error }, "Get room inventory failed");
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to fetch inventory",
        500,
      );
    }
  },
};
