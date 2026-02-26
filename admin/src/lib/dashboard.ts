import api from './api'

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
  },

  getRecentBookings: async (limit: number = 10): Promise<RecentBooking[]> => {
    const response = await api.get('/v1/admin/bookings', { params: { limit } })
    const payload = response.data?.data ?? response.data
    const bookings = payload?.bookings ?? []
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
  },

  getPendingApprovals: async (limit: number = 10): Promise<PendingApproval[]> => {
    const approvals: PendingApproval[] = []
    
    try {
      const vendorsResponse = await api.get('/v1/admin/vendors', { 
        params: { status: 'PENDING', limit: 10 } 
      })
      const vendorsPayload = vendorsResponse.data?.data ?? vendorsResponse.data
      const vendors = vendorsPayload?.vendors ?? []
      
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
      const properties = propertiesPayload?.properties ?? []
      
      properties.forEach((property: any) => {
        approvals.push({
          id: property.id,
          type: 'property',
          name: property.name,
          submittedBy: property.vendor?.businessName,
          submittedAt: property.createdAt,
          description: 'Property approval pending',
        })
      })
    } catch {}

    return approvals.slice(0, limit)
  },

  getRevenueData: async (days: number = 30): Promise<RevenueData> => {
    const response = await api.get('/v1/admin/analytics', { params: { range: days } })
    const payload = response.data?.data ?? response.data
    return {
      total: payload?.totalRevenue ?? 0,
      monthly: payload?.monthly ?? [],
      daily: payload?.daily ?? [],
    }
  },

  getTopVendors: async (limit: number = 5): Promise<TopItem[]> => {
    const response = await api.get('/v1/admin/vendors', { params: { limit, sort: 'bookings' } })
    const payload = response.data?.data ?? response.data
    const vendors = payload?.vendors ?? []
    return vendors.map((vendor: any) => ({
      id: vendor.id,
      name: vendor.businessName ?? vendor.name ?? 'Vendor',
      count: vendor.propertiesCount ?? 0,
      revenue: 0,
    }))
  },

  getTopProperties: async (limit: number = 5): Promise<TopItem[]> => {
    const response = await api.get('/v1/admin/properties', { params: { limit, sort: 'bookings' } })
    const payload = response.data?.data ?? response.data
    const properties = payload?.properties ?? []
    return properties.map((property: any) => ({
      id: property.id,
      name: property.name,
      count: property.bookingsCount ?? 0,
      revenue: 0,
    }))
  },

  getBookingsTrend: async (days: number = 30) => {
    const response = await api.get('/v1/admin/analytics', { params: { range: days } })
    const payload = response.data?.data ?? response.data
    return payload?.bookingsTrend ?? []
  },

  getRevenueTrend: async (days: number = 30) => {
    const response = await api.get('/v1/admin/analytics', { params: { range: days } })
    const payload = response.data?.data ?? response.data
    return payload?.revenueTrend ?? []
  },
}
