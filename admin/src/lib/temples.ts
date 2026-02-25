import api from './api'

export interface Temple {
  id: string
  name: string
  description: string
  city: string
  address: string
  phone?: string
  email?: string
  images: string[]
  mapLocation?: {
    lat: number
    lng: number
  }
  timing?: {
    openTime: string
    closeTime: string
  }
  festivals?: string[]
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTempleRequest {
  name: string
  description: string
  city: string
  address: string
  phone?: string
  email?: string
  images?: string[]
  mapLocation?: {
    lat: number
    lng: number
  }
  timing?: {
    openTime: string
    closeTime: string
  }
  festivals?: string[]
}

export const templesService = {
  getTemples: async (params?: {
    page?: number
    limit?: number
    search?: string
    city?: string
  }) => {
    const response = await api.get('/v1/admin/temples', { params })
    return response.data
  },

  getTempleById: async (id: string) => {
    const response = await api.get<Temple>(`/v1/admin/temples/${id}`)
    return response.data
  },

  createTemple: async (data: CreateTempleRequest) => {
    const response = await api.post<Temple>('/v1/admin/temples', data)
    return response.data
  },

  updateTemple: async (id: string, data: Partial<CreateTempleRequest>) => {
    const response = await api.patch<Temple>(`/v1/admin/temples/${id}`, data)
    return response.data
  },

  deleteTemple: async (id: string) => {
    const response = await api.delete(`/v1/admin/temples/${id}`)
    return response.data
  },

  activateTemple: async (id: string) => {
    const response = await api.patch(`/v1/admin/temples/${id}/activate`)
    return response.data
  },

  deactivateTemple: async (id: string) => {
    const response = await api.patch(`/v1/admin/temples/${id}/deactivate`)
    return response.data
  },
}
