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
    slug?: string
    name: string
    type: 'hotel' | 'home' | 'temple'
    vendor?: {
      id: string
      businessName: string
      commissionRate?: number
    }
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
  cancellationNotes?: string
  createdAt: string
  updatedAt: string
  vendorCommissionRate?: number
  commissionAmount?: number
  vendorEarning?: number
  commissionStatus?: string
}

const normalizeStatus = (status?: string) => {
  if (!status) return 'pending'
  const value = status.toLowerCase().replace('-', '_')
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
        slug: booking.property.slug,
        name: booking.property.name,
        type: booking.property.type?.toLowerCase() ?? 'hotel',
        vendor: booking.property.vendor,
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
  vendorCommissionRate: booking.vendorCommissionRate,
  commissionAmount: booking.commissionAmount,
  vendorEarning: booking.vendorEarning,
  commissionStatus: booking.commissionStatus,
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
        search: params?.search || undefined,
        status: mapStatusToApi(params?.status) || undefined,
        userId: params?.userId || undefined,
        propertyId: params?.propertyId || undefined,
        vendorId: params?.vendorId || undefined,
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
    return mapBooking(payload)
  },

  cancelBooking: async (bookingId: string, reason?: string) => {
    const response = await api.put(`/v1/admin/bookings/${bookingId}/status`, {
      status: 'CANCELLED',
      reason,
    })
    return response.data?.data ?? response.data
  },

  confirmBooking: async (bookingId: string) => {
    const response = await api.put(`/v1/admin/bookings/${bookingId}/status`, {
      status: 'CONFIRMED',
    })
    return response.data?.data ?? response.data
  },

  processRefund: async (bookingId: string, amount?: number, reason?: string) => {
    const response = await api.put(`/v1/admin/bookings/${bookingId}/refund`, {
      ...(amount !== undefined && amount > 0 && { amount }),
      reason,
    })
    return response.data?.data ?? response.data
  },

  checkIn: async (bookingId: string) => {
    const response = await api.put(`/v1/admin/bookings/${bookingId}/status`, {
      status: 'CHECKED_IN',
    })
    return response.data?.data ?? response.data
  },

  checkOut: async (bookingId: string) => {
    const response = await api.put(`/v1/admin/bookings/${bookingId}/status`, {
      status: 'CHECKED_OUT',
    })
    return response.data?.data ?? response.data
  },

  exportBookings: async (params?: Record<string, any>) => {
    const response = await api.get('/v1/admin/export/bookings', {
      responseType: 'blob',
      params,
    })
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bookings_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  getPaymentDetails: async (bookingId: string) => {
    const response = await api.get(`/v1/admin/bookings/${bookingId}/payment`)
    return response.data?.data ?? response.data
  },

  updateBookingStatus: async (bookingId: string, status: string, reason?: string) => {
    const response = await api.put(`/v1/admin/bookings/${bookingId}/status`, { status, ...(reason ? { reason } : {}) })
    return response.data?.data ?? response.data
  },
}
