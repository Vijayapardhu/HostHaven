import api from './api'

export interface DashboardStats {
  totalBookings: number
  totalRevenue: number
  totalActiveVendors: number
  totalUsers: number
  pendingApprovals: number
  newBookingsToday: number
  bookingsTrend?: Array<{
    date: string
    count: number
    revenue: number
  }>
}

export interface RecentBooking {
  id: string
  bookingNumber: string
  propertyName: string
  userName: string
  amount: number
  status: string
  createdAt: string
}

export interface PendingApproval {
  id: string
  type: 'vendor' | 'property'
  name: string
  submittedBy?: string
  submittedAt: string
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/v1/admin/dashboard/stats')
    return response.data
  },

  getRecentBookings: async (limit: number = 5): Promise<RecentBooking[]> => {
    const response = await api.get<RecentBooking[]>('/v1/admin/dashboard/recent-bookings', {
      params: { limit },
    })
    return response.data
  },

  getPendingApprovals: async (limit: number = 10): Promise<PendingApproval[]> => {
    const response = await api.get<PendingApproval[]>('/v1/admin/dashboard/pending-approvals', {
      params: { limit },
    })
    return response.data
  },

  getBookingsTrend: async (days: number = 30) => {
    const response = await api.get('/v1/admin/dashboard/bookings-trend', {
      params: { days },
    })
    return response.data
  },

  getRevenueTrend: async (days: number = 30) => {
    const response = await api.get('/v1/admin/dashboard/revenue-trend', {
      params: { days },
    })
    return response.data
  },

  getTopVendors: async (limit: number = 5) => {
    const response = await api.get('/v1/admin/dashboard/top-vendors', {
      params: { limit },
    })
    return response.data
  },

  getTopProperties: async (limit: number = 5) => {
    const response = await api.get('/v1/admin/dashboard/top-properties', {
      params: { limit },
    })
    return response.data
  },
}
