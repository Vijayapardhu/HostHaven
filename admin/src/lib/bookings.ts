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
    type: 'hotel' | 'home' | 'temple'
  }
  roomTypeId?: string
  checkInDate: string
  checkOutDate: string
  roomsBooked?: number
  nights?: number
  totalAmount: number
  amountPaid?: number
  amountRefunded?: number
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'refunded'
  paymentStatus: 'pending' | 'completed' | 'refunded' | 'failed'
  refundStatus?: 'none' | 'requested' | 'processing' | 'completed'
  specialRequests?: string
  createdAt: string
  updatedAt: string
}

const normalizeStatus = (status?: string) => {
  if (!status) return 'pending'
  const value = status.toLowerCase()
  if (value === 'checked_in' || value === 'checked_out') return value
  if (value === 'confirmed' || value === 'cancelled' || value === 'refunded') return value
  return 'pending'
}

const normalizePaymentStatus = (status?: string) => {
  if (!status) return 'pending'
  const value = status.toLowerCase()
  if (value === 'completed' || value === 'failed' || value === 'refunded') return value
  return 'pending'
}

const mapStatusToApi = (status?: string) => {
  if (!status) return undefined
  return status.toUpperCase()
}

const mapBooking = (booking: any): Booking => ({
  id: booking.id,
  bookingNumber: booking.bookingNumber ?? booking.id,
  userId: booking.user?.id ?? booking.userId,
  user: booking.user,
  propertyId: booking.property?.id ?? booking.propertyId,
  property: booking.property
    ? {
      id: booking.property.id,
      name: booking.property.name,
      type: booking.property.type?.toLowerCase() ?? 'hotel',
    }
    : undefined,
  roomTypeId: booking.roomTypeId ?? booking.room?.id,
  checkInDate: booking.checkInDate,
  checkOutDate: booking.checkOutDate,
  roomsBooked: booking.roomsBooked,
  nights: booking.nights,
  totalAmount: booking.totalAmount ?? 0,
  amountPaid: booking.amountPaid ?? booking.payment?.amount,
  amountRefunded: booking.amountRefunded,
  status: normalizeStatus(booking.status),
  paymentStatus: normalizePaymentStatus(booking.paymentStatus),
  refundStatus: booking.refundStatus,
  specialRequests: booking.specialRequests,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt ?? booking.createdAt,
})

const normalizeList = (payload: any) => {
  const data = payload?.data ?? payload?.bookings ?? []
  const meta = payload?.meta ?? payload?.pagination
  return {
    data: Array.isArray(data) ? data.map(mapBooking) : [],
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

export const bookingsService = {
  getBookings: async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    userId?: string
    propertyId?: string
    vendorId?: string
  }) => {
    const response = await api.get('/v1/admin/bookings', {
      params: {
        page: params?.page,
        limit: params?.limit,
        status: mapStatusToApi(params?.status),
        vendorId: params?.vendorId,
      },
    })
    const normalized = normalizeList(response.data)
    if (!params?.search) {
      return normalized
    }
    const query = params.search.toLowerCase()
    const filtered = normalized.data.filter((booking) => {
      const haystack = [
        booking.bookingNumber,
        booking.user?.name,
        booking.user?.phone,
        booking.property?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
    return { ...normalized, data: filtered }
  },

  getBookingById: async (id: string) => {
    const response = await api.get(`/v1/admin/bookings/${id}`)
    const payload = response.data?.data ?? response.data
    return mapBooking({ ...payload, payment: undefined }) // We map payment separately if needed or just use raw hook
  },

  updateBookingStatus: async (bookingId: string, status: string) => {
    const response = await api.put(`/v1/admin/bookings/${bookingId}/status`, { status })
    return response.data?.data ?? response.data
  },

  getPaymentDetails: async (bookingId: string) => {
    const response = await api.get(`/v1/admin/bookings/${bookingId}/payment`)
    return response.data?.data ?? response.data
  },

  processRefund: async (bookingId: string, amount: number, reason?: string) => {
    const response = await api.put(`/v1/admin/bookings/${bookingId}/refund`, {
      amount,
      reason,
    })
    return response.data?.data ?? response.data
  },

  exportBookings: async (params?: Record<string, any>) => {
    throw new Error('Export bookings endpoint is not available on the backend')
  },
}
