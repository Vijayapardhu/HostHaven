import prisma from '../../config/database';
import { logger } from '../../utils/logger.util';
import { AppError } from '../../utils/app-error';
import type {
  CreateCouponInput,
  UpdateCouponInput,
  CouponListQuery,
  ValidateCouponInput,
} from './coupons.schema';

/**
 * Catalogue management and preview validation for coupons.
 *
 * Redemption itself does NOT live here: a coupon is consumed inside the
 * booking-creation transaction (bookings.service.resolveCoupon), where the
 * usage row, the atomic usage-count increment, and the booking are committed
 * together. This service never writes usage.
 */
export class CouponsService {
  async create(data: CreateCouponInput) {
    const code = data.code.toUpperCase();

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      throw AppError.conflict('Coupon code already exists');
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minBookingAmount: data.minBookingAmount,
        maxDiscountAmount: data.maxDiscountAmount,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        applicableProperties: data.applicableProperties,
        applicableCities: data.applicableCities,
      },
    });

    logger.info({ couponId: coupon.id, code }, 'Coupon created');
    return coupon;
  }

  async list(query: CouponListQuery) {
    const where: any = {};

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const skip = (query.page - 1) * query.limit;

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.coupon.count({ where }),
    ]);

    return {
      coupons,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getById(id: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw AppError.notFound('Coupon not found');
    }
    return coupon;
  }

  async update(id: string, data: UpdateCouponInput) {
    await this.getById(id);

    const updated = await prisma.coupon.update({
      where: { id },
      data,
    });

    logger.info({ couponId: id }, 'Coupon updated');
    return updated;
  }

  /** Soft-deactivation — usage history must survive the coupon. */
  async deactivate(id: string) {
    await this.getById(id);

    await prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info({ couponId: id }, 'Coupon deactivated');
    return { message: 'Coupon deactivated' };
  }

  /** Read-only preview for the browse/checkout UI. Writes nothing. */
  async validate(data: ValidateCouponInput) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (!coupon) {
      throw AppError.notFound('Invalid coupon code');
    }
    if (!coupon.isActive) {
      throw AppError.validation('This coupon is no longer active');
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw AppError.validation('This coupon has expired');
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw AppError.validation('This coupon has reached its usage limit');
    }

    const minAmount = coupon.minBookingAmount
      ? Number(coupon.minBookingAmount)
      : null;
    if (minAmount && data.bookingAmount < minAmount) {
      throw AppError.validation(
        `Minimum booking amount of ₹${minAmount} required`,
      );
    }

    if (
      coupon.applicableProperties.length > 0 &&
      data.propertyId &&
      !coupon.applicableProperties.includes(data.propertyId)
    ) {
      throw AppError.validation(
        'This coupon is not applicable for this property',
      );
    }

    if (
      coupon.applicableCities.length > 0 &&
      data.city &&
      !coupon.applicableCities.includes(data.city.toUpperCase())
    ) {
      throw AppError.validation(
        'This coupon is not applicable in this city',
      );
    }

    const maxDiscount = coupon.maxDiscountAmount
      ? Number(coupon.maxDiscountAmount)
      : null;

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (data.bookingAmount * Number(coupon.discountValue)) / 100;
      if (maxDiscount && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    return {
      valid: true,
      discountAmount: Math.min(discountAmount, data.bookingAmount),
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      description: coupon.description,
    };
  }

  async listPublic() {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      orderBy: { discountValue: 'desc' },
      take: 12,
    });

    // Hide fully-exhausted coupons and expose only safe display fields.
    return coupons
      .filter((c) => !c.usageLimit || c.usageCount < c.usageLimit)
      .map((c) => ({
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: Number(c.discountValue),
        minBookingAmount: c.minBookingAmount ? Number(c.minBookingAmount) : null,
        maxDiscountAmount: c.maxDiscountAmount
          ? Number(c.maxDiscountAmount)
          : null,
        validUntil: c.validUntil,
        applicableCities: c.applicableCities,
      }));
  }
}

export const couponsService = new CouponsService();
export default couponsService;
