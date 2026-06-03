import api from './api'

export interface Coupon {
  id: string
  code: string
  description?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minBookingAmount?: number
  maxDiscountAmount?: number
  maxUses?: number
  usedCount: number
  validFrom: string
  validUntil: string
  isActive: boolean
  applicableProperties?: string[]
  applicablePropertyTypes?: string[]
  createdAt: string
  updatedAt: string
}

const mapCoupon = (coupon: any): Coupon => ({
  id: coupon.id,
  code: coupon.code ?? '',
  description: coupon.description,
  discountType: coupon.discountType ?? 'percentage',
  discountValue: Number(coupon.discountValue ?? 0),
  minBookingAmount: coupon.minBookingAmount ? Number(coupon.minBookingAmount) : undefined,
  maxDiscountAmount: coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : undefined,
  maxUses: coupon.maxUses,
  usedCount: Number(coupon.usedCount ?? 0),
  validFrom: coupon.validFrom,
  validUntil: coupon.validUntil,
  isActive: coupon.isActive ?? true,
  applicableProperties: coupon.applicableProperties,
  applicablePropertyTypes: coupon.applicablePropertyTypes,
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

export const couponsService = {
  getCoupons: async (params?: {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
  }) => {
    const response = await api.get('/v1/coupons', {
      params: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search || undefined,
        isActive: params?.isActive?.toString() || undefined,
      },
    })
    return normalizeListResponse(response.data)
  },

  getCouponById: async (id: string) => {
    const response = await api.get(`/v1/coupons/${id}`)
    const payload = response.data?.data ?? response.data
    return mapCoupon(payload)
  },

  createCoupon: async (data: {
    code: string
    description?: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
    minBookingAmount?: number
    maxDiscountAmount?: number
    maxUses?: number
    validFrom: string
    validUntil: string
    applicableProperties?: string[]
    applicablePropertyTypes?: string[]
  }) => {
    const response = await api.post('/v1/coupons', data)
    return response.data?.data ?? response.data
  },

  updateCoupon: async (id: string, data: Partial<{
    code: string
    description: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
    minBookingAmount: number
    maxDiscountAmount: number
    maxUses: number
    validFrom: string
    validUntil: string
    isActive: boolean
    applicableProperties: string[]
    applicablePropertyTypes: string[]
  }>) => {
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
