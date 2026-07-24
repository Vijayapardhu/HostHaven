import prismaMock from '../../test/prismaMock';
import { CouponsService } from './coupons.service';
import { createCouponSchema } from './coupons.schema';

jest.mock('../../utils/logger.util', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const service = new CouponsService();

const liveCoupon = {
  id: 'coupon-1',
  code: 'SAVE20',
  isActive: true,
  discountType: 'PERCENTAGE',
  discountValue: 20,
  minBookingAmount: null,
  maxDiscountAmount: 500,
  usageLimit: 100,
  usageCount: 10,
  validFrom: new Date('2026-01-01'),
  validUntil: new Date('2027-01-01'),
  applicableProperties: [],
  applicableCities: [],
};

describe('createCouponSchema', () => {
  const base = {
    code: 'SAVE20',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    validFrom: '2026-01-01',
    validUntil: '2027-01-01',
  };

  it('rejects a percentage discount above 100', () => {
    const result = createCouponSchema.safeParse({
      ...base,
      discountValue: 500,
    });
    expect(result.success).toBe(false);
  });

  it('allows a fixed discount above 100', () => {
    const result = createCouponSchema.safeParse({
      ...base,
      discountType: 'FIXED',
      discountValue: 500,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a validity window that ends before it starts', () => {
    const result = createCouponSchema.safeParse({
      ...base,
      validFrom: '2027-01-01',
      validUntil: '2026-01-01',
    });
    expect(result.success).toBe(false);
  });
});

describe('CouponsService.validate', () => {
  beforeEach(() => {
    prismaMock.coupon.findUnique.mockReset();
  });

  it('caps a percentage discount at maxDiscountAmount', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(liveCoupon);

    // 20% of 10,000 is 2,000 — capped to 500.
    const result = await service.validate({
      code: 'save20',
      bookingAmount: 10000,
    });

    expect(result.discountAmount).toBe(500);
  });

  it('never discounts more than the booking amount', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue({
      ...liveCoupon,
      discountType: 'FIXED',
      discountValue: 5000,
      maxDiscountAmount: null,
    });

    const result = await service.validate({
      code: 'SAVE20',
      bookingAmount: 1200,
    });

    expect(result.discountAmount).toBe(1200);
  });

  it('rejects an exhausted coupon', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue({
      ...liveCoupon,
      usageLimit: 10,
      usageCount: 10,
    });

    await expect(
      service.validate({ code: 'SAVE20', bookingAmount: 1000 }),
    ).rejects.toThrow('usage limit');
  });

  it('rejects a coupon outside its validity window', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue({
      ...liveCoupon,
      validFrom: new Date('2020-01-01'),
      validUntil: new Date('2020-12-31'),
    });

    await expect(
      service.validate({ code: 'SAVE20', bookingAmount: 1000 }),
    ).rejects.toThrow('expired');
  });
});

describe('CouponsService.create', () => {
  beforeEach(() => {
    prismaMock.coupon.findUnique.mockReset();
    prismaMock.coupon.create.mockReset();
  });

  it('uppercases the code and rejects duplicates', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(liveCoupon);

    await expect(
      service.create(
        createCouponSchema.parse({
          code: 'save20',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          validFrom: '2026-01-01',
          validUntil: '2027-01-01',
        }),
      ),
    ).rejects.toThrow('already exists');

    expect(prismaMock.coupon.findUnique).toHaveBeenCalledWith({
      where: { code: 'SAVE20' },
    });
    expect(prismaMock.coupon.create).not.toHaveBeenCalled();
  });
});
