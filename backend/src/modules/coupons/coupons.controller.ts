import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../../config/database";
import { sendSuccess, sendError } from "../../utils/response.util";
import { ERROR_CODES } from "../../constants/error-codes";
import { logger } from "../../utils/logger.util";

export class CouponsController {
  async createCoupon(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as {
        code: string;
        description?: string;
        discountType: "PERCENTAGE" | "FIXED";
        discountValue: number;
        minBookingAmount?: number;
        maxDiscountAmount?: number;
        usageLimit?: number;
        perUserLimit?: number;
        validFrom: string;
        validUntil: string;
        applicableProperties?: string[];
        applicableCities?: string[];
      };

      const {
        code,
        description,
        discountType,
        discountValue,
        minBookingAmount,
        maxDiscountAmount,
        usageLimit,
        perUserLimit,
        validFrom,
        validUntil,
        applicableProperties,
        applicableCities,
      } = data;

      const existingCoupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (existingCoupon) {
        return sendError(reply, ERROR_CODES.RESOURCE_CONFLICT, "Coupon code already exists", 409);
      }

      const coupon = await prisma.coupon.create({
        data: {
          code: code.toUpperCase(),
          description,
          discountType,
          discountValue,
          minBookingAmount,
          maxDiscountAmount,
          usageLimit,
          perUserLimit: perUserLimit || 1,
          validFrom: new Date(validFrom),
          validUntil: new Date(validUntil),
          applicableProperties: applicableProperties || [],
          applicableCities: applicableCities || [],
        },
      });

      return sendSuccess(reply, coupon, 201);
    } catch (error: any) {
      logger.error({ error }, "Create coupon failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to create coupon", 500);
    }
  }

  async getCoupons(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { search, isActive } = request.query as { search?: string; isActive?: string };

      const where: any = {};
      
      if (search) {
        where.OR = [
          { code: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      if (isActive !== undefined) {
        where.isActive = isActive === "true";
      }

      const coupons = await prisma.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      return sendSuccess(reply, coupons);
    } catch (error: any) {
      logger.error({ error }, "Get coupons failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to fetch coupons", 500);
    }
  }

  async getCouponById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const coupon = await prisma.coupon.findUnique({
        where: { id },
      });

      if (!coupon) {
        return sendError(reply, ERROR_CODES.RESOURCE_NOT_FOUND, "Coupon not found", 404);
      }

      return sendSuccess(reply, coupon);
    } catch (error: any) {
      logger.error({ error }, "Get coupon failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to fetch coupon", 500);
    }
  }

  async updateCoupon(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as {
        description?: string;
        discountType?: "PERCENTAGE" | "FIXED";
        discountValue?: number;
        minBookingAmount?: number;
        maxDiscountAmount?: number;
        usageLimit?: number;
        perUserLimit?: number;
        validFrom?: string;
        validUntil?: string;
        isActive?: boolean;
        applicableProperties?: string[];
        applicableCities?: string[];
      };

      const coupon = await prisma.coupon.findUnique({
        where: { id },
      });

      if (!coupon) {
        return sendError(reply, ERROR_CODES.RESOURCE_NOT_FOUND, "Coupon not found", 404);
      }

      const updateData: any = { ...data };
      
      if (data.validFrom) updateData.validFrom = new Date(data.validFrom);
      if (data.validUntil) updateData.validUntil = new Date(data.validUntil);

      const updated = await prisma.coupon.update({
        where: { id },
        data: updateData,
      });

      return sendSuccess(reply, updated);
    } catch (error: any) {
      logger.error({ error }, "Update coupon failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to update coupon", 500);
    }
  }

  async deleteCoupon(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const coupon = await prisma.coupon.findUnique({
        where: { id },
      });

      if (!coupon) {
        return sendError(reply, ERROR_CODES.RESOURCE_NOT_FOUND, "Coupon not found", 404);
      }

      await prisma.coupon.update({
        where: { id },
        data: { isActive: false },
      });

      return sendSuccess(reply, { message: "Coupon deactivated" });
    } catch (error: any) {
      logger.error({ error }, "Delete coupon failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to delete coupon", 500);
    }
  }

  async validateCoupon(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { code, bookingAmount, propertyId, city } = request.body as {
        code: string;
        bookingAmount: number;
        propertyId?: string;
        city?: string;
      };

      const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!coupon) {
        return sendError(reply, ERROR_CODES.RESOURCE_NOT_FOUND, "Invalid coupon code", 404);
      }

      if (!coupon.isActive) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "This coupon is no longer active", 400);
      }

      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "This coupon has expired", 400);
      }

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "This coupon has reached its usage limit", 400);
      }

      const minAmount = coupon.minBookingAmount ? Number(coupon.minBookingAmount) : null;
      if (minAmount && bookingAmount < minAmount) {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          `Minimum booking amount of ₹${minAmount} required`,
          400
        );
      }

      if (coupon.applicableProperties.length > 0 && propertyId) {
        if (!coupon.applicableProperties.includes(propertyId)) {
          return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "This coupon is not applicable for this property", 400);
        }
      }

      if (coupon.applicableCities.length > 0 && city) {
        if (!coupon.applicableCities.includes(city.toUpperCase())) {
          return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "This coupon is not applicable in this city", 400);
        }
      }

      const maxDiscount = coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null;
      let discountAmount = 0;
      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = (bookingAmount * Number(coupon.discountValue)) / 100;
        if (maxDiscount && discountAmount > maxDiscount) {
          discountAmount = maxDiscount;
        }
      } else {
        discountAmount = Number(coupon.discountValue);
      }

      return sendSuccess(reply, {
        valid: true,
        discountAmount: Math.min(discountAmount, bookingAmount),
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description,
      });
    } catch (error: any) {
      logger.error({ error }, "Validate coupon failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to validate coupon", 500);
    }
  }

  async applyCoupon(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { code, bookingAmount, propertyId, city, userId } = request.body as {
        code: string;
        bookingAmount: number;
        propertyId?: string;
        city?: string;
        userId: string;
      };

      const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!coupon) {
        return sendError(reply, ERROR_CODES.RESOURCE_NOT_FOUND, "Invalid coupon code", 404);
      }

      if (!coupon.isActive) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "This coupon is no longer active", 400);
      }

      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "This coupon has expired", 400);
      }

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "This coupon has reached its usage limit", 400);
      }

      const userUsage = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      });

      if (userUsage >= coupon.perUserLimit) {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          `You have already used this coupon ${coupon.perUserLimit} time(s)`,
          400
        );
      }

      const minAmount = coupon.minBookingAmount ? Number(coupon.minBookingAmount) : null;
      if (minAmount && bookingAmount < minAmount) {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          `Minimum booking amount of ₹${minAmount} required`,
          400
        );
      }

      const maxDisc = coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null;
      let discountAmount = 0;
      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = (bookingAmount * Number(coupon.discountValue)) / 100;
        if (maxDisc && discountAmount > maxDisc) {
          discountAmount = maxDisc;
        }
      } else {
        discountAmount = Number(coupon.discountValue);
      }

      const finalAmount = Math.max(0, bookingAmount - discountAmount);

      // Record coupon usage and increment usage count
      await prisma.$transaction([
        prisma.couponUsage.create({
          data: {
            couponId: coupon.id,
            userId,
            discountAmount: Math.min(discountAmount, bookingAmount),
          },
        }),
        prisma.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        }),
      ]);

      return sendSuccess(reply, {
        couponCode: coupon.code,
        discountAmount: Math.min(discountAmount, bookingAmount),
        finalAmount,
        originalAmount: bookingAmount,
      });
    } catch (error: any) {
      logger.error({ error }, "Apply coupon failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to apply coupon", 500);
    }
  }
}

export const couponsController = new CouponsController();
