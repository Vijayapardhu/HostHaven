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
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'processing' | 'partially_refunded'
  refundReason?: string
  refundableBalance?: number
  razorpayPaymentId?: string
  razorpayOrderId?: string
  errorCode?: string
  errorDesc?: string
  bookingNumber?: string
  propertyName?: string
  user?: { name?: string; email?: string; phone?: string }
  refunds?: Array<{ id: string; amount: number; reason?: string; status: string; createdAt: string }>
  createdAt: string
  updatedAt: string
}

export interface RefundItem {
  id: string
  paymentId: string
  amount: number
  reason?: string
  status: string
  razorpayRefundId?: string
  bookingNumber?: string
  createdAt: string
}

export interface Payout {
  id: string
  vendorId: string
  vendorName: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paid' | 'approved' | 'rejected'
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
  if (value === 'approved') return 'approved'
  if (value === 'paid') return 'paid'
  if (value === 'rejected') return 'rejected'
  if (value === 'completed') return 'completed'
  if (value === 'processing') return 'processing'
  if (value === 'failed') return 'failed'
  return 'pending'
}

const mapPayment = (payment: any): Payment => ({
  id: payment.id,
  transactionId: payment.transactionId ?? payment.razorpayPaymentId ?? payment.id,
  bookingId: payment.bookingId ?? payment.booking?.id,
  serviceBookingId: payment.serviceBookingId,
  vendorId: payment.vendorId ?? payment.vendor?.id,
  amount: Number(payment.amount ?? 0),
  currency: payment.currency ?? 'INR',
  method: payment.method ?? payment.paymentMethod ?? 'upi',
  status: (payment.status?.toLowerCase() ?? 'pending') as Payment['status'],
  refundReason: payment.refundReason,
  refundableBalance: payment.refundableBalance,
  razorpayPaymentId: payment.razorpayPaymentId,
  razorpayOrderId: payment.razorpayOrderId,
  errorCode: payment.errorCode,
  errorDesc: payment.errorDesc,
  bookingNumber: payment.bookingNumber ?? payment.booking?.bookingNumber,
  propertyName: payment.propertyName ?? payment.booking?.property?.name,
  user: payment.user,
  refunds: payment.refunds,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt ?? payment.createdAt,
})

const normalizePaymentsList = (payload: any) => {
  const data = payload?.data ?? payload?.payments ?? []
  const meta = payload?.meta ?? payload?.pagination
  return {
    data: Array.isArray(data) ? data.map(mapPayment) : [],
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
    startDate?: string
    endDate?: string
  }) => {
    const response = await api.get('/v1/admin/payments', { 
      params: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search || undefined,
        status: params?.status || undefined,
        bookingId: params?.bookingId || undefined,
        vendorId: params?.vendorId || undefined,
        startDate: params?.startDate || undefined,
        endDate: params?.endDate || undefined,
      }
    })
    return normalizePaymentsList(response.data)
  },

  getPaymentById: async (id: string) => {
    const response = await api.get(`/v1/payments/${id}`)
    return response.data?.data ?? response.data
  },

  refundPayment: async (paymentId: string, amount?: number, reason?: string) => {
    const response = await api.put(`/v1/admin/payments/${paymentId}/refund`, {
      ...(amount !== undefined && amount > 0 && { amount }),
      reason,
    })
    return response.data?.data ?? response.data
  },

  getPayouts: async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    vendorId?: string
    startDate?: string
    endDate?: string
  }) => {
    const response = await api.get('/v1/admin/payouts', { 
      params: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search || undefined,
        status: params?.status || undefined,
        vendorId: params?.vendorId || undefined,
        startDate: params?.startDate || undefined,
        endDate: params?.endDate || undefined,
      }
    })
    return normalizeList(response.data)
  },

  getPayoutById: async (id: string) => {
    const response = await api.get('/v1/admin/payouts', { params: { page: 1, limit: 100 } })
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

  getVendorEarnings: async (params?: { vendorId?: string; search?: string }) => {
    const response = await api.get('/v1/admin/payouts/earnings', { params })
    return response.data?.data ?? response.data
  },

  getRefunds: async (params?: { page?: number; limit?: number; search?: string; status?: string; startDate?: string; endDate?: string }) => {
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
