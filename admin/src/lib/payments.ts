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
  if (value === 'completed') return 'completed'
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

const emptyPaymentsResponse = {
  data: [] as Payment[],
  pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
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
    return emptyPaymentsResponse
  },

  getPaymentById: async (id: string) => {
    const response = await api.get(`/v1/payments/${id}`)
    return response.data?.data ?? response.data
  },

  refundPayment: async (paymentId: string, reason: string) => {
    throw new Error('Refund endpoint is not available on the backend')
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

  createPayout: async (vendorId: string, amount: number) => {
    throw new Error('Create payout endpoint is not available on the backend')
  },

  cancelPayout: async (payoutId: string, reason: string) => {
    throw new Error('Cancel payout endpoint is not available on the backend')
  },

  getPaymentStats: async () => {
    throw new Error('Payment stats endpoint is not available on the backend')
  },

  exportPayments: async (params?: Record<string, any>) => {
    throw new Error('Export payments endpoint is not available on the backend')
  },

  exportPayouts: async (params?: Record<string, any>) => {
    throw new Error('Export payouts endpoint is not available on the backend')
  },
}
