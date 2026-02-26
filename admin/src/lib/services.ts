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
  active?: boolean
}

const emptyServiceResponse = {
  data: [] as Service[],
  pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
}

export const servicesService = {
  getServices: async (params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
  }) => {
    try {
      const response = await api.get('/v1/services', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching services:', error)
      return emptyServiceResponse
    }
  },

  getServiceById: async (id: string) => {
    const response = await api.get(`/v1/services/${id}`)
    return response.data.data
  },

  createService: async (data: CreateServiceRequest) => {
    const response = await api.post('/v1/services', data)
    return response.data.data
  },

  updateService: async (id: string, data: Partial<CreateServiceRequest>) => {
    const response = await api.put(`/v1/services/${id}`, data)
    return response.data.data
  },

  deleteService: async (id: string) => {
    const response = await api.delete(`/v1/services/${id}`)
    return response.data.data
  },

  activateService: async (id: string) => {
    const response = await api.post(`/v1/services/${id}/activate`)
    return response.data.data
  },

  deactivateService: async (id: string) => {
    const response = await api.post(`/v1/services/${id}/deactivate`)
    return response.data.data
  },

  getCategories: async () => {
    return [
      { label: 'Transport', value: 'transport' },
      { label: 'Guide', value: 'guide' },
      { label: 'Photography', value: 'photography' },
      { label: 'Food & Dining', value: 'food' },
      { label: 'Other', value: 'other' },
    ]
  },
}
