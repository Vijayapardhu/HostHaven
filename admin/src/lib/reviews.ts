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
}

const normalizeStatus = (review: any): Review['status'] => {
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
        rating: params?.rating,
        propertyId: params?.propertyId,
      },
    })
    const normalized = normalizeList(response.data)
    let filtered = normalized.data
    if (params?.status) {
      filtered = filtered.filter((review) => review.status === params.status)
    }
    if (params?.search) {
      const query = params.search.toLowerCase()
      filtered = filtered.filter((review) => {
        const haystack = [review.userName, review.title, review.comment, review.propertyId]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(query)
      })
    }
    return { ...normalized, data: filtered }
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
