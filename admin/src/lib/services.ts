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

type RawService = Service & {
  isActive?: boolean
  price?: number
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

const normalizeService = (service: RawService): Service => {
  const normalizedBasePrice =
    typeof service.basePrice === 'number'
      ? service.basePrice
      : typeof service.price === 'number'
      ? service.price
      : 0

  return {
    ...service,
    basePrice: normalizedBasePrice,
    active: service.active ?? service.isActive ?? false,
  }
}

export const servicesService = {
  getServices: async (params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
  }) => {
    try {
      const response = await api.get('/v1/services', { 
        params: {
          page: params?.page,
          limit: params?.limit,
          search: params?.search || undefined,
          category: params?.category || undefined,
        }
      })
      const payload = response.data
      const rawData = payload?.data ?? payload?.services ?? []
      return {
        data: Array.isArray(rawData)
          ? rawData.map((service: RawService) => normalizeService(service))
          : [],
        pagination: payload?.meta ?? { total: payload?.data?.length ?? 0 }
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      return emptyServiceResponse
    }
  },

  getServiceById: async (id: string) => {
    const response = await api.get(`/v1/services/${id}`)
    return normalizeService(response.data.data as RawService)
  },

  createService: async (data: CreateServiceRequest) => {
    const response = await api.post('/v1/services', data)
    return normalizeService(response.data.data as RawService)
  },

  updateService: async (id: string, data: Partial<CreateServiceRequest>) => {
    const response = await api.put(`/v1/services/${id}`, data)
    return normalizeService(response.data.data as RawService)
  },

  deleteService: async (id: string) => {
    const response = await api.delete(`/v1/services/${id}`)
    return response.data.data
  },

  activateService: async (id: string) => {
    const response = await api.post(`/v1/services/${id}/activate`)
    return normalizeService(response.data.data as RawService)
  },

  deactivateService: async (id: string) => {
    const response = await api.post(`/v1/services/${id}/deactivate`)
    return normalizeService(response.data.data as RawService)
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
