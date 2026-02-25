import api from './api'

export interface Service {
  id: string
  name: string
  category: string
  description: string
  basePrice: number
  advanceValue?: number
  advanceType?: 'percentage' | 'fixed'
  images: string[]
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateServiceRequest {
  name: string
  category: string
  description: string
  basePrice: number
  advanceValue?: number
  advanceType?: 'percentage' | 'fixed'
  images?: string[]
}

export const servicesService = {
  getServices: async (params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
  }) => {
    const response = await api.get('/v1/admin/services', { params })
    return response.data
  },

  getServiceById: async (id: string) => {
    const response = await api.get<Service>(`/v1/admin/services/${id}`)
    return response.data
  },

  createService: async (data: CreateServiceRequest) => {
    const response = await api.post<Service>('/v1/admin/services', data)
    return response.data
  },

  updateService: async (id: string, data: Partial<CreateServiceRequest>) => {
    const response = await api.patch<Service>(`/v1/admin/services/${id}`, data)
    return response.data
  },

  deleteService: async (id: string) => {
    const response = await api.delete(`/v1/admin/services/${id}`)
    return response.data
  },

  activateService: async (id: string) => {
    const response = await api.patch(`/v1/admin/services/${id}/activate`)
    return response.data
  },

  deactivateService: async (id: string) => {
    const response = await api.patch(`/v1/admin/services/${id}/deactivate`)
    return response.data
  },

  getCategories: async () => {
    const response = await api.get<string[]>('/v1/admin/services/categories')
    return response.data
  },
}
