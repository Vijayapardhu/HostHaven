import api from './api'

export interface User {
  id: string
  phone: string
  name?: string
  email?: string
  status: 'active' | 'suspended'
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
  }) => {
    const response = await api.get('/v1/admin/users', { params })
    return normalizeList(response.data)
  },

  getUserById: async (id: string) => {
    throw new Error('User detail endpoint is not available for admin users')
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
    throw new Error('Delete user endpoint is not available for admin users')
  },
}
