import api from './api'

export interface ServiceBooking {
  id: string
  serviceBookingNumber?: string
  bookingNumber?: string
  userId: string
  user?: {
    id: string
    phone: string
    name?: string
  }
  serviceId?: string
  service?: { name?: string; category?: string }
  serviceName?: string
  serviceCategory?: string
  serviceDate?: string
  serviceTime?: string
  location?: string
  totalAmount: number
  advanceAmount?: number
  remainingAmount?: number
  status: 'ADVANCE_PAID' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'REFUNDED'
  notes?: string
  cancellationReason?: string
  adminContactedAt?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
}

const normalizeList = (payload: any) => {
  const data = payload?.data ?? payload?.serviceBookings ?? payload?.bookings ?? []
  const meta = payload?.meta ?? payload?.pagination
  return {
    data: Array.isArray(data) ? data : [],
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

export const serviceBookingsService = {
  getServiceBookings: async (params?: {
    page?: number
    limit?: number
    status?: string
  }) => {
    const response = await api.get('/v1/services/bookings/admin', { 
      params: {
        page: params?.page,
        limit: params?.limit,
        status: params?.status || undefined,
      }
    })
    return normalizeList(response.data)
  },

  getServiceBookingById: async (id: string) => {
    const response = await api.get<any>(`/v1/services/bookings/admin/${id}`)
    return response.data?.data ?? response.data
  },

  acceptServiceBooking: async (bookingId: string) => {
    const response = await api.put(`/v1/services/bookings/admin/${bookingId}/status`, {
      status: 'CONFIRMED',
    })
    return response.data?.data ?? response.data
  },

  completeServiceBooking: async (bookingId: string) => {
    const response = await api.put(`/v1/services/bookings/admin/${bookingId}/status`, {
      status: 'COMPLETED',
    })
    return response.data?.data ?? response.data
  },

  cancelServiceBooking: async (bookingId: string, reason?: string) => {
    const response = await api.put(`/v1/services/bookings/admin/${bookingId}/status`, {
      status: 'CANCELLED',
      cancellationReason: reason,
    })
    return response.data?.data ?? response.data
  },

  rejectServiceBooking: async (bookingId: string, reason: string) => {
    const response = await api.put(`/v1/services/bookings/admin/${bookingId}/status`, {
      status: 'CANCELLED',
      cancellationReason: reason,
    })
    return response.data?.data ?? response.data
  },

  processServiceRefund: async (bookingId: string, amount: number, reason?: string) => {
    const response = await api.post(`/v1/services/bookings/admin/${bookingId}/refund`, {
      amount,
      reason,
    })
    return response.data?.data ?? response.data
  },
}
