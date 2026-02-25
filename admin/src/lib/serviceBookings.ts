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

export const serviceBookingsService = {
  getServiceBookings: async (params?: {
    page?: number
    limit?: number
    status?: string
  }) => {
    const response = await api.get('/v1/services/bookings/admin', { params })
    return response.data
  },

  getServiceBookingById: async (id: string) => {
    const response = await api.get<ServiceBooking>(`/v1/services/bookings/admin/${id}`)
    return response.data
  },

  acceptServiceBooking: async (bookingId: string) => {
    const response = await api.put(`/v1/services/bookings/admin/${bookingId}/status`, {
      status: 'CONFIRMED',
    })
    return response.data
  },

  completeServiceBooking: async (bookingId: string) => {
    const response = await api.put(`/v1/services/bookings/admin/${bookingId}/status`, {
      status: 'COMPLETED',
    })
    return response.data
  },

  cancelServiceBooking: async (bookingId: string, reason?: string) => {
    const response = await api.put(`/v1/services/bookings/admin/${bookingId}/status`, {
      status: 'CANCELLED',
      cancellationReason: reason,
    })
    return response.data
  },

  rejectServiceBooking: async (bookingId: string, reason: string) => {
    const response = await api.put(`/v1/services/bookings/admin/${bookingId}/status`, {
      status: 'CANCELLED',
      cancellationReason: reason,
    })
    return response.data
  },

  processServiceRefund: async (bookingId: string, amount: number, reason?: string) => {
    const response = await api.post(`/v1/services/bookings/admin/${bookingId}/refund`, {
      amount,
      reason,
    })
    return response.data
  },
}
