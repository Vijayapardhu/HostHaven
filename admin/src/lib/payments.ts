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
    return response.data
  },

  getPaymentById: async (id: string) => {
    const response = await api.get<Payment>(`/v1/admin/payments/${id}`)
    return response.data
  },

  refundPayment: async (paymentId: string, reason: string) => {
    const response = await api.post(`/v1/admin/payments/${paymentId}/refund`, { reason })
    return response.data
  },

  getPayouts: async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    vendorId?: string
  }) => {
    const response = await api.get('/v1/admin/payouts', { params })
    return response.data
  },

  getPayoutById: async (id: string) => {
    const response = await api.get<Payout>(`/v1/admin/payouts/${id}`)
    return response.data
  },

  createPayout: async (vendorId: string, amount: number) => {
    const response = await api.post('/v1/admin/payouts', { vendorId, amount })
    return response.data
  },

  cancelPayout: async (payoutId: string, reason: string) => {
    const response = await api.patch(`/v1/admin/payouts/${payoutId}/cancel`, { reason })
    return response.data
  },

  getPaymentStats: async () => {
    const response = await api.get('/v1/admin/payments/stats')
    return response.data
  },

  exportPayments: async (params?: Record<string, any>) => {
    const response = await api.get('/v1/admin/payments/export', {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  exportPayouts: async (params?: Record<string, any>) => {
    const response = await api.get('/v1/admin/payouts/export', {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
