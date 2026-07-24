import { FastifyRequest, FastifyReply } from "fastify";
import { sendSuccess, sendError } from "../../utils/response.util";
import { ERROR_CODES } from "../../constants/error-codes";
import { logger } from "../../utils/logger.util";
import couponsService from "./coupons.service";
import {
  createCouponSchema,
  updateCouponSchema,
  couponIdSchema,
  couponListQuerySchema,
  validateCouponSchema,
} from "./coupons.schema";

const respondWithError = (
  reply: FastifyReply,
  error: any,
  fallback: string,
) => {
  if (error.name === "ZodError") {
    return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "Invalid input data", 400);
  }
  if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
    return sendError(reply, error.code, error.message, 404);
  }
  if (error.code === ERROR_CODES.RESOURCE_CONFLICT) {
    return sendError(reply, error.code, error.message, 409);
  }
  if (error.code === ERROR_CODES.VALIDATION_ERROR) {
    return sendError(reply, error.code, error.message, 400);
  }
  logger.error({ error }, fallback);
  return sendError(reply, ERROR_CODES.INTERNAL_ERROR, fallback, 500);
};

export class CouponsController {
  async createCoupon(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createCouponSchema.parse(request.body);
      const coupon = await couponsService.create(data);
      return sendSuccess(reply, coupon, 201);
    } catch (error: any) {
      return respondWithError(reply, error, "Failed to create coupon");
    }
  }

  async getPublicCoupons(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const available = await couponsService.listPublic();
      return sendSuccess(reply, available);
    } catch (error: any) {
      return respondWithError(reply, error, "Failed to fetch offers");
    }
  }

  async getCoupons(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = couponListQuerySchema.parse(request.query);
      const result = await couponsService.list(query);
      return sendSuccess(reply, result.coupons, 200, result.meta);
    } catch (error: any) {
      return respondWithError(reply, error, "Failed to fetch coupons");
    }
  }

  async getCouponById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = couponIdSchema.parse(request.params);
      const coupon = await couponsService.getById(id);
      return sendSuccess(reply, coupon);
    } catch (error: any) {
      return respondWithError(reply, error, "Failed to fetch coupon");
    }
  }

  async updateCoupon(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = couponIdSchema.parse(request.params);
      const data = updateCouponSchema.parse(request.body);
      const updated = await couponsService.update(id, data);
      return sendSuccess(reply, updated);
    } catch (error: any) {
      return respondWithError(reply, error, "Failed to update coupon");
    }
  }

  async deleteCoupon(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = couponIdSchema.parse(request.params);
      const result = await couponsService.deactivate(id);
      return sendSuccess(reply, result);
    } catch (error: any) {
      return respondWithError(reply, error, "Failed to delete coupon");
    }
  }

  async validateCoupon(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = validateCouponSchema.parse(request.body);
      const result = await couponsService.validate(data);
      return sendSuccess(reply, result);
    } catch (error: any) {
      return respondWithError(reply, error, "Failed to validate coupon");
    }
  }
}

export const couponsController = new CouponsController();
