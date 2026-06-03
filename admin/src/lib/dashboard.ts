import api from './api'

const inflightRequests = new Map<string, Promise<unknown>>()

async function deduped<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (inflightRequests.has(key)) {
    return inflightRequests.get(key) as Promise<T>
  }
  const promise = fn().finally(() => inflightRequests.delete(key))
  inflightRequests.set(key, promise)
  return promise
}

export interface DashboardStats {
  totalBookings: number
  totalRevenue: number
  totalActiveVendors: number
  totalUsers: number
  pendingApprovals: number
  newBookingsToday: number
  totalProperties: number
  pendingProperties: number
  activeProperties: number
  totalServiceBookings: number
  totalSupportTickets: number
  openTickets: number
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
  checkInDate?: string
  checkOutDate?: string
}

export interface PendingApproval {
  id: string
  slug?: string
  type: 'vendor' | 'property'
  name: string
  submittedBy?: string
  submittedAt: string
  description?: string
}

export interface RevenueData {
  total: number
  monthly: Array<{ month: string; revenue: number; bookings: number }>
  daily: Array<{ date: string; revenue: number; bookings: number }>
}

export interface TopItem {
  id: string
  name: string
  count: number
  revenue: number
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    return deduped('dashboard-stats', async () => {
      const response = await api.get('/v1/admin/dashboard')
      const payload = response.data?.data ?? response.data
      return {
        totalBookings: payload?.stats?.totalBookings ?? 0,
        totalRevenue: payload?.stats?.totalRevenue ?? 0,
        totalActiveVendors: payload?.stats?.totalVendors ?? 0,
        totalUsers: payload?.stats?.totalUsers ?? 0,
        pendingApprovals: (payload?.stats?.pendingVendors ?? 0) + (payload?.stats?.pendingProperties ?? 0),
        newBookingsToday: payload?.stats?.newBookingsToday ?? 0,
        totalProperties: payload?.stats?.totalProperties ?? 0,
        pendingProperties: payload?.stats?.pendingProperties ?? 0,
        activeProperties: payload?.stats?.activeProperties ?? 0,
        totalServiceBookings: payload?.stats?.totalServiceBookings ?? 0,
        totalSupportTickets: payload?.stats?.totalSupportTickets ?? 0,
        openTickets: payload?.stats?.openTickets ?? 0,
      }
    })
  },

  getRecentBookings: async (limit: number = 10): Promise<RecentBooking[]> => {
    return deduped(`dashboard-bookings-${limit}`, async () => {
      const response = await api.get('/v1/admin/bookings', { params: { limit } })
      const payload = response.data?.data ?? response.data
      const bookings = Array.isArray(payload) ? payload : (payload?.bookings ?? [])
      return bookings.slice(0, limit).map((booking: any) => ({
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        propertyName: booking.property?.name ?? 'Property',
        userName: booking.user?.name ?? booking.user?.email ?? 'Guest',
        amount: Number(booking.totalAmount ?? 0),
        status: booking.status,
        createdAt: booking.createdAt,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
      }))
    })
  },

  getPendingApprovals: async (limit: number = 10): Promise<PendingApproval[]> => {
    return deduped(`dashboard-approvals-${limit}`, async () => {
      const approvals: PendingApproval[] = []
      
      try {
        const vendorsResponse = await api.get('/v1/admin/vendors', { 
          params: { status: 'PENDING', limit: 10 } 
        })
        const vendorsPayload = vendorsResponse.data?.data ?? vendorsResponse.data
        const vendors = Array.isArray(vendorsPayload) ? vendorsPayload : (vendorsPayload?.vendors ?? [])
        
        vendors.forEach((vendor: any) => {
          approvals.push({
            id: vendor.id,
            type: 'vendor',
            name: vendor.businessName ?? vendor.name ?? 'Vendor',
            submittedBy: vendor.user?.email,
            submittedAt: vendor.createdAt,
            description: 'Vendor approval pending',
          })
        })
      } catch {}

      try {
        const propertiesResponse = await api.get('/v1/admin/properties', { 
          params: { status: 'PENDING', limit: 10 } 
        })
        const propertiesPayload = propertiesResponse.data?.data ?? propertiesResponse.data
        const properties = Array.isArray(propertiesPayload) ? propertiesPayload : (propertiesPayload?.properties ?? [])
        
        properties.forEach((property: any) => {
          approvals.push({
            id: property.id,
            slug: property.slug,
            type: 'property',
            name: property.name,
            submittedBy: property.vendor?.businessName,
            submittedAt: property.createdAt,
            description: 'Property approval pending',
          })
        })
      } catch {}

      return approvals.slice(0, limit)
    })
  },

  getRevenueData: async (days: number = 30): Promise<RevenueData> => {
    return deduped(`dashboard-revenue-${days}`, async () => {
      const rangeMap: Record<number, string> = {
        7: "7d",
        30: "30d",
        90: "3m",
      }
      const range = rangeMap[days] || "30d"
      const response = await api.get('/v1/admin/analytics', { params: { range } })
      const payload = response.data?.data ?? response.data
      
      const monthly = (payload?.revenueByMonth ?? []).map((item: any) => ({
        month: item.month,
        revenue: item.amount || 0,
        bookings: 0,
      }))
      
      const daily = (payload?.bookingsByMonth ?? []).map((item: any) => ({
        date: item.month,
        revenue: 0,
        bookings: item.count || 0,
      }))
      
      return {
        total: payload?.totalRevenue ?? 0,
        monthly,
        daily,
      }
    })
  },

  getTopVendors: async (limit: number = 5): Promise<TopItem[]> => {
    return deduped(`dashboard-top-vendors-${limit}`, async () => {
      const response = await api.get('/v1/admin/vendors', { params: { limit } })
      const payload = response.data?.data ?? response.data
      const vendors = Array.isArray(payload) ? payload : (payload?.vendors ?? [])
      return vendors.map((vendor: any) => ({
        id: vendor.id,
        name: vendor.businessName ?? vendor.name ?? 'Vendor',
        count: vendor.propertiesCount ?? 0,
        revenue: 0,
      }))
    })
  },

  getTopProperties: async (limit: number = 5): Promise<TopItem[]> => {
    return deduped(`dashboard-top-properties-${limit}`, async () => {
      const response = await api.get('/v1/admin/properties', { params: { limit } })
      const payload = response.data?.data ?? response.data
      const properties = Array.isArray(payload) ? payload : (payload?.properties ?? [])
      return properties.map((property: any) => ({
        id: property.id,
        name: property.name,
        count: property.bookingsCount ?? 0,
        revenue: 0,
      }))
    })
  },

  getBookingsTrend: async (days: number = 30) => {
    return deduped(`dashboard-bookings-trend-${days}`, async () => {
      const rangeMap: Record<number, string> = { 7: "7d", 30: "30d", 90: "3m" }
      const range = rangeMap[days] || "30d"
      const response = await api.get('/v1/admin/analytics', { params: { range } })
      const payload = response.data?.data ?? response.data
      return payload?.bookingsByMonth ?? []
    })
  },

  getRevenueTrend: async (days: number = 30) => {
    return deduped(`dashboard-revenue-trend-${days}`, async () => {
      const rangeMap: Record<number, string> = { 7: "7d", 30: "30d", 90: "3m" }
      const range = rangeMap[days] || "30d"
      const response = await api.get('/v1/admin/analytics', { params: { range } })
      const payload = response.data?.data ?? response.data
      return payload?.revenueByMonth ?? []
    })
  },
}
