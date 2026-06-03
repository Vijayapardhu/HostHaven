import api from './api'

export interface User {
  id: string
  phone: string
  name?: string
  email?: string
  status: 'active' | 'suspended' | 'deleted'
  createdAt: string
  updatedAt: string
  bookingsCount?: number
  reviewsCount?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface UserDetail extends User {
  address?: string
  isDeleted?: boolean
  deletedAt?: string
  isVerified?: boolean
  emailVerifiedAt?: string
  lastLoginAt?: string
  lastLoginIp?: string
  role?: string
  totalSpent?: number
  bookings?: any[]
  reviews?: any[]
  serviceBookings?: any[]
  wishlist?: any[]
  _count?: {
    bookings?: number
    reviews?: number
    serviceBookings?: number
    wishlistItems?: number
  }
}

export interface UserSession {
  id: string
  device?: string
  deviceType?: string
  ip?: string
  ipAddress?: string
  location?: string
  userAgent?: string
  isActive?: boolean
  createdAt: string
  lastActive?: string
  expiresAt?: string
}

const mapUser = (user: any): User => {
  const isActive = Boolean(user.isActive ?? true)
  return {
    id: user.id,
    phone: user.phone ?? '',
    name: user.name ?? undefined,
    email: user.email ?? undefined,
    status: isActive ? 'active' : 'suspended',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt ?? user.createdAt,
    bookingsCount: user.bookingsCount,
    reviewsCount: user.reviewsCount,
  }
}

const normalizeList = (payload: any): PaginatedResponse<User> => {
  const data = payload?.data ?? payload?.users ?? []
  const meta = payload?.meta ?? payload?.pagination
  return {
    data: Array.isArray(data) ? data.map(mapUser) : [],
    pagination: {
      total: meta?.total ?? 0,
      page: meta?.page ?? 1,
      limit: meta?.limit ?? 10,
      pages: meta?.totalPages ?? meta?.pages ?? 1,
    },
  }
}

export const usersService = {
  getUsers: async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    role?: string
  }) => {
    const response = await api.get('/v1/admin/users', { 
      params: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search || undefined,
        status: params?.status || undefined,
        role: params?.role || undefined,
      }
    })
    return normalizeList(response.data)
  },

  getUserById: async (id: string) => {
    const response = await api.get(`/v1/admin/users/${id}`)
    const payload = response.data?.data ?? response.data
    return mapUser(payload)
  },

  suspendUser: async (id: string) => {
    const response = await api.put(`/v1/admin/users/${id}/status`, { isActive: false })
    return response.data?.data ?? response.data
  },

  activateUser: async (id: string) => {
    const response = await api.put(`/v1/admin/users/${id}/status`, { isActive: true })
    return response.data?.data ?? response.data
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/v1/admin/users/${id}`)
    return response.data?.data ?? response.data
  },

  verifyEmail: async (id: string) => {
    const response = await api.put(`/v1/admin/users/${id}/verify-email`)
    return response.data?.data ?? response.data
  },

  resetPassword: async (id: string) => {
    const response = await api.post(`/v1/admin/users/${id}/reset-password`)
    return response.data?.data ?? response.data
  },

  getSessions: async (id: string) => {
    const response = await api.get(`/v1/admin/users/${id}/sessions`)
    const payload = response.data?.data ?? response.data
    return Array.isArray(payload) ? payload : payload?.sessions ?? []
  },
}
