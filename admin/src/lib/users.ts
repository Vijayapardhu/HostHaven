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

export const usersService = {
  getUsers: async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }) => {
    const response = await api.get<PaginatedResponse<User>>('/v1/admin/users', { params })
    return response.data
  },

  getUserById: async (id: string) => {
    const response = await api.get<User>(`/v1/admin/users/${id}`)
    return response.data
  },

  suspendUser: async (id: string) => {
    const response = await api.patch(`/v1/admin/users/${id}/suspend`)
    return response.data
  },

  activateUser: async (id: string) => {
    const response = await api.patch(`/v1/admin/users/${id}/activate`)
    return response.data
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/v1/admin/users/${id}`)
    return response.data
  },
}
