import api from './api'

export interface Review {
  id: string
  bookingId?: string
  propertyId: string
  userId: string
  userName: string
  rating: number
  title: string
  comment: string
  images?: string[]
  status: 'approved' | 'pending' | 'rejected'
  createdAt: string
  updatedAt: string
  propertyName?: string
  propertyCity?: string
  propertyType?: string
  isVisible?: boolean
  isVerified?: boolean
  vendorResponse?: string
  respondedAt?: string
  cleanliness?: number
  service?: number
  location?: number
  value?: number
}

const normalizeStatus = (review: any): Review['status'] => {
  if (review?.status) return review.status
  if (review?.isVisible === false) return 'rejected'
  if (review?.isVerified === false) return 'pending'
  return 'approved'
}

const mapReview = (review: any): Review => ({
  id: review.id,
  bookingId: review.bookingId,
  propertyId: review.property?.id ?? review.propertyId,
  userId: review.user?.id ?? review.userId,
  userName: review.user?.name ?? 'User',
  rating: review.rating ?? 0,
  title: review.title ?? '',
  comment: review.comment ?? '',
  images: review.images,
  status: normalizeStatus(review),
  createdAt: review.createdAt,
  updatedAt: review.updatedAt ?? review.createdAt,
  propertyName: review.property?.name,
  propertyCity: review.property?.city,
  propertyType: review.property?.type,
  isVisible: review.isVisible,
  isVerified: review.isVerified,
  vendorResponse: review.vendorResponse,
  respondedAt: review.respondedAt,
  cleanliness: review.cleanliness,
  service: review.service,
  location: review.location,
  value: review.value,
})

const normalizeList = (payload: any) => {
  const data = payload?.data ?? payload?.reviews ?? []
  const meta = payload?.meta ?? payload?.pagination
  return {
    data: Array.isArray(data) ? data.map(mapReview) : [],
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

export const reviewsService = {
  getReviews: async (params?: {
    page?: number
    limit?: number
    search?: string
    rating?: number
    status?: string
    propertyId?: string
  }) => {
    const response = await api.get('/v1/admin/reviews', {
      params: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search || undefined,
        status: params?.status || undefined,
        rating: params?.rating,
        propertyId: params?.propertyId,
      },
    })
    const payload = response.data
    const data = payload?.data ?? []
    const meta = payload?.meta ?? payload?.pagination
    return {
      data: Array.isArray(data) ? data.map(mapReview) : [],
      pagination: meta
        ? {
            total: meta.total ?? 0,
            page: meta.page ?? 1,
            limit: meta.limit ?? 10,
            totalPages: meta.totalPages ?? meta.pages ?? 1,
          }
        : { total: 0, page: 1, limit: 10, totalPages: 1 },
    }
  },

  getReviewById: async (id: string) => {
    const response = await api.get(`/v1/reviews/${id}`)
    const payload = response.data?.data ?? response.data
    return mapReview(payload)
  },

  approveReview: async (id: string) => {
    const response = await api.put(`/v1/admin/reviews/${id}/unhide`)
    return response.data?.data ?? response.data
  },

  rejectReview: async (id: string, reason?: string) => {
    const response = await api.put(`/v1/admin/reviews/${id}/hide`, { reason })
    return response.data?.data ?? response.data
  },

  deleteReview: async (id: string) => {
    const response = await api.delete(`/v1/admin/reviews/${id}`)
    return response.data?.data ?? response.data
  },

  hideReview: async (id: string) => {
    const response = await api.put(`/v1/admin/reviews/${id}/hide`)
    return response.data?.data ?? response.data
  },

  unhideReview: async (id: string) => {
    const response = await api.put(`/v1/admin/reviews/${id}/unhide`)
    return response.data?.data ?? response.data
  },

  verifyReview: async (id: string) => {
    const response = await api.put(`/v1/admin/reviews/${id}/verify`)
    return response.data?.data ?? response.data
  },

  updateReviewContent: async (id: string, data: { title?: string; comment?: string }) => {
    const response = await api.put(`/v1/admin/reviews/${id}`, data)
    return response.data?.data ?? response.data
  },

  getPendingReviews: async (limit: number = 20) => {
    const response = await api.get('/v1/admin/reviews', { params: { limit } })
    const normalized = normalizeList(response.data)
    return { ...normalized, data: normalized.data.filter((review) => review.status === 'pending') }
  },
}
