import api from './api'

export interface Booking {
  id: string
  bookingNumber: string
  userId: string
  user?: {
    id: string
    phone: string
    name?: string
  }
  propertyId: string
  property?: {
    id: string
    name: string
    type: 'hotel' | 'home'
  }
  roomTypeId?: string
  checkInDate: string
  checkOutDate: string
  roomsBooked?: number
  nights?: number
  totalAmount: number
  amountPaid?: number
  amountRefunded?: number
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
  paymentStatus: 'pending' | 'completed' | 'refunded' | 'failed'
  refundStatus?: 'none' | 'requested' | 'processing' | 'completed'
  specialRequests?: string
  createdAt: string
  updatedAt: string
}

export const bookingsService = {
  getBookings: async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    userId?: string
    propertyId?: string
  }) => {
    const response = await api.get('/v1/admin/bookings', { params })
    return response.data
  },

  getBookingById: async (id: string) => {
    const response = await api.get<Booking>(`/v1/admin/bookings/${id}`)
    return response.data
  },

  cancelBooking: async (bookingId: string, reason?: string) => {
    const response = await api.patch(`/v1/admin/bookings/${bookingId}/cancel`, { reason })
    return response.data
  },

  confirmBooking: async (bookingId: string) => {
    const response = await api.patch(`/v1/admin/bookings/${bookingId}/confirm`)
    return response.data
  },

  processRefund: async (bookingId: string, amount: number, reason?: string) => {
    const response = await api.post(`/v1/admin/bookings/${bookingId}/refund`, {
      amount,
      reason,
    })
    return response.data
  },

  checkIn: async (bookingId: string) => {
    const response = await api.patch(`/v1/admin/bookings/${bookingId}/check-in`)
    return response.data
  },

  checkOut: async (bookingId: string) => {
    const response = await api.patch(`/v1/admin/bookings/${bookingId}/check-out`)
    return response.data
  },

  exportBookings: async (params?: Record<string, any>) => {
    const response = await api.get('/v1/admin/bookings/export', {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
