import api from './api'

export interface Property {
  id: string
  name: string
  type: 'hotel' | 'home'
  city: string
  address: string
  description?: string
  amenities?: string[]
  images?: string[]
  video?: string
  mapLocation?: { lat: number; lng: number }
  pricing?: {
    basePrice: number
    weekendPrice?: number
  }
  status: 'pending' | 'approved' | 'rejected' | 'inactive'
  vendorId?: string
  rating?: number
  reviewCount?: number
  createdAt: string
  updatedAt: string
}

export const propertiesService = {
  getProperties: async (params?: {
    page?: number
    limit?: number
    search?: string
    type?: string
    status?: string
    city?: string
  }) => {
    const response = await api.get('/v1/admin/properties', { params })
    return response.data
  },

  getPropertyById: async (id: string) => {
    const response = await api.get<Property>(`/v1/admin/properties/${id}`)
    return response.data
  },

  getPendingProperties: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/v1/admin/properties/pending', { params })
    return response.data
  },

  approveProperty: async (propertyId: string, notes?: string) => {
    const response = await api.patch(`/v1/admin/properties/${propertyId}/approve`, { notes })
    return response.data
  },

  rejectProperty: async (propertyId: string, notes?: string) => {
    const response = await api.patch(`/v1/admin/properties/${propertyId}/reject`, { notes })
    return response.data
  },

  updateProperty: async (propertyId: string, data: Partial<Property>) => {
    const response = await api.patch(`/v1/admin/properties/${propertyId}`, data)
    return response.data
  },

  deleteProperty: async (propertyId: string) => {
    const response = await api.delete(`/v1/admin/properties/${propertyId}`)
    return response.data
  },

  listCities: async () => {
    const response = await api.get('/v1/admin/cities')
    return response.data
  },
}
