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

export const reviewsService = {
  getReviews: async (params?: {
    page?: number
    limit?: number
    search?: string
    rating?: number
    status?: string
    propertyId?: string
  }) => {
    const response = await api.get('/v1/admin/reviews', { params })
    return response.data
  },

  getReviewById: async (id: string) => {
    const response = await api.get<Review>(`/v1/admin/reviews/${id}`)
    return response.data
  },

  approveReview: async (id: string) => {
    const response = await api.patch(`/v1/admin/reviews/${id}/approve`)
    return response.data
  },

  rejectReview: async (id: string, reason?: string) => {
    const response = await api.patch(`/v1/admin/reviews/${id}/reject`, { reason })
    return response.data
  },

  deleteReview: async (id: string) => {
    const response = await api.delete(`/v1/admin/reviews/${id}`)
    return response.data
  },

  getPendingReviews: async (limit: number = 20) => {
    const response = await api.get('/v1/admin/reviews/pending', {
      params: { limit },
    })
    return response.data
  },
}
