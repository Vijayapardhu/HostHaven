import api from './api'

export interface AnalyticsData {
  totalUsers: number
  userGrowth: number
  totalProperties: number
  propertyGrowth: number
  totalBookings: number
  bookingGrowth: number
  totalRevenue: number
  revenueGrowth: number
  bookingsByMonth: { month: string; count: number }[]
  revenueByMonth: { month: string; amount: number }[]
  topProperties: { name: string; bookings: number; revenue: number }[]
}

export const analyticsService = {
  getAnalytics: async (range: '7d' | '30d' | '3m') => {
    const response = await api.get<AnalyticsData>('/v1/admin/analytics', {
      params: { range },
    })
    return response.data
  },
}
