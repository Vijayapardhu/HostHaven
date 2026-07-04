import api from './api'

// Field names mirror the backend Coupon model exactly (uppercase discountType,
// usageLimit/usageCount, applicableCities) so reads and writes line up.
export type DiscountType = 'PERCENTAGE' | 'FIXED'

export interface Coupon {
  id: string
  code: string
  description?: string
  discountType: DiscountType
  discountValue: number
  minBookingAmount?: number
  maxDiscountAmount?: number
  usageLimit?: number
  usageCount: number
  perUserLimit: number
  validFrom: string
  validUntil: string
  isActive: boolean
  applicableProperties: string[]
  applicableCities: string[]
  createdAt: string
  updatedAt: string
}

const mapCoupon = (coupon: any): Coupon => ({
  id: coupon.id,
  code: coupon.code ?? '',
  description: coupon.description ?? undefined,
  discountType: (coupon.discountType ?? 'PERCENTAGE') as DiscountType,
  discountValue: Number(coupon.discountValue ?? 0),
  minBookingAmount:
    coupon.minBookingAmount != null ? Number(coupon.minBookingAmount) : undefined,
  maxDiscountAmount:
    coupon.maxDiscountAmount != null ? Number(coupon.maxDiscountAmount) : undefined,
  usageLimit: coupon.usageLimit != null ? Number(coupon.usageLimit) : undefined,
  usageCount: Number(coupon.usageCount ?? 0),
  perUserLimit: Number(coupon.perUserLimit ?? 1),
  validFrom: coupon.validFrom,
  validUntil: coupon.validUntil,
  isActive: coupon.isActive ?? true,
  applicableProperties: Array.isArray(coupon.applicableProperties)
    ? coupon.applicableProperties
    : [],
  applicableCities: Array.isArray(coupon.applicableCities)
    ? coupon.applicableCities
    : [],
  createdAt: coupon.createdAt,
  updatedAt: coupon.updatedAt ?? coupon.createdAt,
})

const normalizeListResponse = (payload: any) => {
  const data = payload?.data ?? payload?.coupons ?? []
  const meta = payload?.meta ?? payload?.pagination
  return {
    data: Array.isArray(data) ? data.map(mapCoupon) : [],
    pagination: meta
      ? {
          total: meta.total ?? 0,
          page: meta.page ?? 1,
          limit: meta.limit ?? 10,
          totalPages: meta.totalPages ?? meta.pages ?? 1,
        }
      : { total: 0, page: 1, limit: 10, totalPages: 1 },
  }
}

export interface CouponInput {
  code: string
  description?: string
  discountType: DiscountType
  discountValue: number
  minBookingAmount?: number
  maxDiscountAmount?: number
  usageLimit?: number
  perUserLimit?: number
  validFrom: string
  validUntil: string
  applicableProperties?: string[]
  applicableCities?: string[]
}

export const couponsService = {
  getCoupons: async (params?: { search?: string; isActive?: boolean }) => {
    const response = await api.get('/v1/coupons', {
      params: {
        search: params?.search || undefined,
        isActive: params?.isActive != null ? String(params.isActive) : undefined,
      },
    })
    return normalizeListResponse(response.data)
  },

  getCouponById: async (id: string) => {
    const response = await api.get(`/v1/coupons/${id}`)
    const payload = response.data?.data ?? response.data
    return mapCoupon(payload)
  },

  createCoupon: async (data: CouponInput) => {
    const response = await api.post('/v1/coupons', data)
    return response.data?.data ?? response.data
  },

  updateCoupon: async (
    id: string,
    data: Partial<CouponInput & { isActive: boolean }>,
  ) => {
    const response = await api.put(`/v1/coupons/${id}`, data)
    return response.data?.data ?? response.data
  },

  deleteCoupon: async (id: string) => {
    const response = await api.delete(`/v1/coupons/${id}`)
    return response.data?.data ?? response.data
  },

  toggleCoupon: async (id: string, isActive: boolean) => {
    const response = await api.put(`/v1/coupons/${id}`, { isActive })
    return response.data?.data ?? response.data
  },
}
