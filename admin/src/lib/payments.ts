import api from './api'

export interface Payment {
  id: string
  transactionId: string
  bookingId?: string
  serviceBookingId?: string
  vendorId?: string
  amount: number
  currency: string
  method: 'card' | 'upi' | 'netbanking' | 'wallet'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  refundReason?: string
  createdAt: string
  updatedAt: string
}

export interface Payout {
  id: string
  vendorId: string
  vendorName: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  upiId?: string
  bankAccount?: string
  bankName?: string
  referenceId?: string
  createdAt: string
  updatedAt: string
}

const normalizePayoutStatus = (status?: string): Payout['status'] => {
  if (!status) return 'pending'
  const value = status.toLowerCase()
  if (value === 'completed' || value === 'paid') return 'completed'
  if (value === 'processing') return 'processing'
  if (value === 'failed' || value === 'rejected') return 'failed'
  return 'pending'
}

const mapPayout = (payout: any): Payout => ({
  id: payout.id,
  vendorId: payout.vendor?.id ?? payout.vendorId,
  vendorName: payout.vendor?.businessName ?? payout.vendorName ?? 'Vendor',
  amount: Number(payout.amount ?? 0),
  status: normalizePayoutStatus(payout.status),
  upiId: payout.upiId,
  bankAccount: payout.bankAccount,
  bankName: payout.bankName,
  referenceId: payout.transactionId ?? payout.referenceId,
  createdAt: payout.createdAt,
  updatedAt: payout.updatedAt ?? payout.createdAt,
})

const normalizeList = (payload: any) => {
  const data = payload?.data ?? payload?.payouts ?? []
  const meta = payload?.meta ?? payload?.pagination
  return {
    data: Array.isArray(data) ? data.map(mapPayout) : [],
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

export const paymentsService = {
  getPayments: async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    bookingId?: string
    vendorId?: string
  }) => {
    const response = await api.get('/v1/admin/payments', { params })
    const data = response.data?.data ?? response.data?.payments ?? []
    const meta = response.data?.meta ?? response.data?.pagination

    const mappedData = data.map((p: any) => ({
      id: p.id,
      transactionId: p.razorpayPaymentId || p.id,
      bookingId: p.bookingId,
      bookingNumber: p.bookingNumber,
      propertyName: p.propertyName,
      userName: p.user?.name,
      amount: p.amount,
      currency: p.currency,
      method: p.method?.toLowerCase() || 'other',
      status: p.status?.toLowerCase(),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt || p.createdAt,
    }))

    return {
      data: mappedData,
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

  getPaymentById: async (id: string) => {
    const response = await api.get(`/v1/admin/payments/${id}`)
    return response.data?.data ?? response.data
  },

  refundPayment: async (paymentId: string, reason: string) => {
    const response = await api.put(`/v1/admin/payments/${paymentId}/refund`, { reason })
    return response.data?.data ?? response.data
  },

  getPayouts: async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    vendorId?: string
  }) => {
    const response = await api.get('/v1/admin/payouts', { params })
    return normalizeList(response.data)
  },

  getPayoutById: async (id: string) => {
    const response = await api.get('/v1/admin/payouts', { params: { page: 1, limit: 50 } })
    const normalized = normalizeList(response.data)
    return normalized.data.find((item: Payout) => item.id === id)
  },

  markPayoutPaid: async (payoutId: string, transactionId: string, notes?: string) => {
    const response = await api.put(`/v1/admin/payouts/${payoutId}/mark-paid`, { transactionId, notes })
    return response.data?.data ?? response.data
  },

  createPayout: async (vendorId: string, amount?: number) => {
    const response = await api.post('/v1/admin/payouts', { vendorId, amount })
    return response.data?.data ?? response.data
  },

  getVendorEarnings: async () => {
    const response = await api.get('/v1/admin/payouts/earnings')
    return response.data?.data ?? response.data
  },

  cancelPayout: async (payoutId: string, reason: string) => {
    throw new Error('Cancel payout endpoint is not available on the backend')
  },

  getPaymentStats: async () => {
    const response = await api.get('/v1/admin/analytics')
    return response.data?.data ?? response.data
  },

  exportPayments: async (entity: 'payments' | 'refunds') => {
    const response = await api.get(`/v1/admin/export/${entity}`, { responseType: 'blob' })
    return response.data
  }
}
