import { z } from 'zod';

const couponCore = {
  description: z.string().max(500).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.coerce.number().positive(),
  minBookingAmount: z.coerce.number().positive().optional(),
  maxDiscountAmount: z.coerce.number().positive().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  perUserLimit: z.coerce.number().int().positive().max(100).default(1),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  applicableProperties: z.array(z.string().uuid()).default([]),
  applicableCities: z.array(z.string().min(1).max(80)).default([]),
};

/** A percentage discount above 100 makes every booking free — never valid. */
const boundedDiscount = (data: {
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
}) => data.discountType !== 'PERCENTAGE' || data.discountValue <= 100;

export const createCouponSchema = z
  .object({
    code: z
      .string()
      .min(3)
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, 'Only letters, numbers, - and _'),
    ...couponCore,
  })
  .refine(boundedDiscount, {
    message: 'A percentage discount cannot exceed 100',
    path: ['discountValue'],
  })
  .refine((data) => data.validUntil > data.validFrom, {
    message: 'validUntil must be after validFrom',
    path: ['validUntil'],
  });

export const updateCouponSchema = z
  .object({
    ...Object.fromEntries(
      Object.entries(couponCore).map(([key, schema]) => [
        key,
        (schema as z.ZodTypeAny).optional(),
      ]),
    ),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data: any) =>
      data.discountType !== 'PERCENTAGE' ||
      data.discountValue === undefined ||
      data.discountValue <= 100,
    { message: 'A percentage discount cannot exceed 100', path: ['discountValue'] },
  );

export const couponIdSchema = z.object({
  id: z.string().uuid(),
});

export const couponListQuerySchema = z.object({
  search: z.string().max(120).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1).max(60),
  bookingAmount: z.coerce.number().positive(),
  propertyId: z.string().uuid().optional(),
  city: z.string().max(80).optional(),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type CouponListQuery = z.infer<typeof couponListQuerySchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
