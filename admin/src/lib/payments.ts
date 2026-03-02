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
    const response = await api.get('/v1/admin/payments', { params })
    const payload = response.data?.data ?? response.data
    const data = payload?.payments ?? payload?.data ?? []
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
  },

  getPaymentById: async (id: string) => {
    const response = await api.get(`/v1/payments/${id}`)
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

  createPayout: async (vendorId: string, amount?: number) => {
    const response = await api.post('/v1/admin/payouts', { vendorId, ...(amount != null && { amount }) })
    return response.data?.data ?? response.data
  },

  processPayout: async (payoutId: string, action: 'APPROVED' | 'REJECTED', notes?: string) => {
    const response = await api.post('/v1/admin/payouts/process', {
      payoutId,
      action,
      notes,
    })
    return response.data?.data ?? response.data
  },

  markPayoutPaid: async (payoutId: string, transactionId: string, notes?: string) => {
    const response = await api.put(`/v1/admin/payouts/${payoutId}/mark-paid`, {
      transactionId,
      notes,
    })
    return response.data?.data ?? response.data
  },

  cancelPayout: async (payoutId: string, reason: string) => {
    const response = await api.post('/v1/admin/payouts/process', {
      payoutId,
      action: 'REJECTED',
      notes: reason,
    })
    return response.data?.data ?? response.data
  },

  getVendorEarnings: async (params?: { vendorId?: string }) => {
    const response = await api.get('/v1/admin/payouts/earnings', { params })
    return response.data?.data ?? response.data
  },

  getRefunds: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/v1/admin/refunds', { params })
    const payload = response.data?.data ?? response.data
    const data = payload?.refunds ?? payload?.data ?? []
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
  },

  getPaymentStats: async () => {
    const response = await api.get('/v1/admin/dashboard')
    const payload = response.data?.data ?? response.data
    return {
      totalRevenue: payload?.stats?.totalRevenue ?? 0,
      totalPayments: payload?.stats?.totalBookings ?? 0,
      pendingPayouts: payload?.stats?.pendingPayouts ?? 0,
    }
  },

  exportPayments: async (params?: Record<string, any>) => {
    const response = await api.get('/v1/admin/export/payments', {
      responseType: 'blob',
      params,
    })
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payments_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  exportPayouts: async (params?: Record<string, any>) => {
    const response = await api.get('/v1/admin/export/payouts', {
      responseType: 'blob',
      params,
    })
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payouts_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },
}
