import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import paymentsService from './payments.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { ERROR_CODES } from '../../constants/error-codes';
import { logger } from '../../utils/logger.util';
import { config } from '../../config';
import {
  createPaymentOrderSchema,
  verifyPaymentSchema,
  paymentIdSchema,
} from './payments.schema';

const createVendorOrderSchema = z.object({
  bookingId: z.string().uuid(),
})

const createServiceOrderSchema = z.object({
  serviceBookingId: z.string().uuid(),
})

const verifyServicePaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  serviceBookingId: z.string().uuid(),
})

export const PaymentsController = {
  async getPublicKey(request: FastifyRequest, reply: FastifyReply) {
    try {
      const publicKey = config.razorpay.keyId;
      return sendSuccess(reply, { publicKey });
    } catch (error: any) {
      logger.error({ error }, 'Get public key failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to get public key', 500);
    }
  },

  async createVendorOrder(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { bookingId } = createVendorOrderSchema.parse(request.body)
      const user = (request as any).user
      if (!user?.id) {
        return sendError(reply, ERROR_CODES.UNAUTHORIZED, 'Authentication required', 401)
      }
      const userId = user.id
      const vendorId = (request as any).user.vendorId;

      const result = await paymentsService.createVendorOrder(bookingId, vendorId);
      return sendSuccess(reply, result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid input', 400)
      }
      logger.error({ error }, 'Create vendor payment order failed');

      if (error.code === ERROR_CODES.BOOKING_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }

      return sendError(reply, ERROR_CODES.PAYMENT_FAILED, 'Failed to create payment order', 500);
    }
  },

  async createOrder(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { bookingId } = createPaymentOrderSchema.parse(request.body);
      const user = (request as any).user
      if (!user?.id) {
        return sendError(reply, ERROR_CODES.UNAUTHORIZED, 'Authentication required', 401)
      }
      const userId = user.id

      const result = await paymentsService.createOrder(bookingId, userId);
      return sendSuccess(reply, result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid input', 400)
      }
      logger.error({ error }, 'Create payment order failed');

      if (error.code === ERROR_CODES.BOOKING_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.code === ERROR_CODES.VALIDATION_ERROR) {
        return sendError(reply, error.code, error.message, 400);
      }

      return sendError(reply, ERROR_CODES.PAYMENT_FAILED, 'Failed to create payment order', 500);
    }
  },

  async verifyPayment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = verifyPaymentSchema.parse(request.body);
      const user = (request as any).user
      if (!user?.id) {
        return sendError(reply, ERROR_CODES.UNAUTHORIZED, 'Authentication required', 401)
      }
      const userId = user.id

      const result = await paymentsService.verifyPayment(data, userId);
      return sendSuccess(reply, result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid input', 400)
      }
      logger.error({ error }, 'Payment verification failed');

      if (error.code === ERROR_CODES.PAYMENT_FAILED) {
        return sendError(reply, error.code, error.message, 400);
      }
      if (error.code === ERROR_CODES.UNAUTHORIZED) {
        return sendError(reply, error.code, error.message, 401);
      }

      return sendError(reply, ERROR_CODES.PAYMENT_FAILED, 'Payment verification failed', 500);
    }
  },

  async createServiceOrder(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { serviceBookingId } = createServiceOrderSchema.parse(request.body)
      const user = (request as any).user
      if (!user?.id) {
        return sendError(reply, ERROR_CODES.UNAUTHORIZED, 'Authentication required', 401)
      }
      const userId = user.id

      const result = await paymentsService.createServiceOrder(serviceBookingId, userId);
      return sendSuccess(reply, result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid input', 400)
      }
      logger.error({ error }, 'Create service payment order failed');

      if (error.code === ERROR_CODES.BOOKING_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }

      return sendError(reply, ERROR_CODES.PAYMENT_FAILED, 'Failed to create payment order', 500);
    }
  },

  async verifyServicePayment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = verifyServicePaymentSchema.parse(request.body)
      const user = (request as any).user
      if (!user?.id) {
        return sendError(reply, ERROR_CODES.UNAUTHORIZED, 'Authentication required', 401)
      }
      const userId = user.id

      const result = await paymentsService.verifyServicePayment(body, userId);
      return sendSuccess(reply, result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid input', 400)
      }
      logger.error({ error }, 'Service payment verification failed');

      if (error.code === ERROR_CODES.PAYMENT_FAILED) {
        return sendError(reply, error.code, error.message, 400);
      }

      return sendError(reply, ERROR_CODES.PAYMENT_FAILED, 'Payment verification failed', 500);
    }
  },

  async webhook(request: FastifyRequest, reply: FastifyReply) {
    try {
      const signature = request.headers['x-razorpay-signature'] as string;
      const payload = request.body;
      const rawBody = (request as any).rawBody as string | undefined;

      if (!signature || !rawBody) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Missing webhook signature or payload', 400);
      }

      const result = await paymentsService.handleWebhook(rawBody, payload, signature);

      if (!result.success) {
        const msg = result.error || 'Invalid webhook signature'
        return sendError(reply, ERROR_CODES.INVALID_TOKEN, msg, 400);
      }

      return sendSuccess(reply, { received: true });
    } catch (error: any) {
      logger.error({ error }, 'Webhook handling failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Webhook handling failed', 500);
    }
  },

  async getPayment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = paymentIdSchema.parse(request.params);
      const user = (request as any).user
      if (!user?.id) {
        return sendError(reply, ERROR_CODES.UNAUTHORIZED, 'Authentication required', 401)
      }
      const userId = user.id

      const payment = await paymentsService.getPaymentById(id, userId);
      return sendSuccess(reply, payment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid input', 400)
      }
      logger.error({ error }, 'Get payment failed');

      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }

      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch payment', 500);
    }
  },
};
