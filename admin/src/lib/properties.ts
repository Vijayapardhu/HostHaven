import api from './api'

export interface Property {
  id: string
  name: string
  type: 'hotel' | 'home' | 'temple'
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
  status: 'pending' | 'approved' | 'inactive' | 'rejected'
  vendorId?: string
  rating?: number
  reviewCount?: number
  isFeatured?: boolean
  isVerified?: boolean
  rooms?: any[]
  cancellationPolicy?: {
    id: string
    freeBeforeHours: number
    refundPercentBefore: number
    refundPercentAfter: number
  } | null
  houseDetails?: any
  createdAt: string
  updatedAt: string
}

const normalizeStatus = (status?: string): Property['status'] => {
  if (!status) return 'pending'
  const value = status.toUpperCase()
  if (value === 'ACTIVE') return 'approved'
  if (value === 'INACTIVE') return 'inactive'
  if (value === 'REJECTED') return 'rejected'
  return 'pending'
}

const normalizeType = (type?: string): Property['type'] => {
  if (!type) return 'hotel'
  const value = type.toUpperCase()
  if (value === 'HOME') return 'home'
  if (value === 'TEMPLE') return 'temple'
  return 'hotel'
}

const mapStatusToApi = (status?: string) => {
  if (!status) return undefined
  if (status === 'approved') return 'ACTIVE'
  if (status === 'inactive') return 'INACTIVE'
  if (status === 'rejected') return 'REJECTED'
  return 'PENDING'
}

const mapTypeToApi = (type?: string) => {
  if (!type) return undefined
  if (type === 'home') return 'HOME'
  if (type === 'temple') return 'TEMPLE'
  return 'HOTEL'
}

const mapProperty = (property: any): Property => ({
  id: property.id,
  name: property.name,
  type: normalizeType(property.type),
  city: property.city ?? property.state ?? '',
  address: property.address ?? '',
  description: property.description,
  amenities: property.amenities,
  images: property.images,
  video: property.video,
  mapLocation: property.mapLocation,
  pricing: property.pricing,
  status: normalizeStatus(property.status),
  vendorId: property.vendor?.id ?? property.vendorId,
  rating: property.rating,
  reviewCount: property.reviewCount,
  isFeatured: property.isFeatured,
  isVerified: property.isVerified,
  rooms: property.rooms ?? [],
  cancellationPolicy: property.cancellationPolicy ?? null,
  houseDetails: property.featureFlags ?? null,
  createdAt: property.createdAt,
  updatedAt: property.updatedAt ?? property.createdAt,
})

const normalizeList = (payload: any) => {
  const data = payload?.data ?? payload?.properties ?? []
  const meta = payload?.meta ?? payload?.pagination
  return {
    data: Array.isArray(data) ? data.map(mapProperty) : [],
    pagination: meta
      ? {
        total: meta.total ?? 0,
        page: meta.page ?? 1,
        limit: meta.limit ?? 10,
        totalPages: meta.totalPages ?? meta.pages ?? 1,
      }
      : { total: 0, page: 1, limit: 10, totalPages: 1 },
  }
}

export const propertiesService = {
  getProperties: async (params?: {
    page?: number
    limit?: number
    search?: string
    type?: string
    status?: string
    city?: string
    vendorId?: string
  }) => {
    const response = await api.get('/v1/admin/properties', {
      params: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search,
        status: mapStatusToApi(params?.status),
        type: mapTypeToApi(params?.type),
        city: params?.city,
        vendorId: params?.vendorId,
      },
    })
    return normalizeList(response.data)
  },

  getPropertyById: async (id: string) => {
    const response = await api.get(`/v1/admin/properties/${id}`)
    const payload = response.data?.data ?? response.data
    return mapProperty(payload)
  },

  getPendingProperties: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/v1/admin/properties', {
      params: { page: params?.page, limit: params?.limit, status: 'PENDING' },
    })
    return normalizeList(response.data)
  },

  approveProperty: async (propertyId: string, notes?: string) => {
    const response = await api.put(`/v1/admin/properties/${propertyId}/status`, {
      status: 'ACTIVE',
      reason: notes,
    })
    return response.data?.data ?? response.data
  },

  rejectProperty: async (propertyId: string, notes?: string) => {
    const response = await api.put(`/v1/admin/properties/${propertyId}/status`, {
      status: 'REJECTED',
      reason: notes,
    })
    return response.data?.data ?? response.data
  },

  updateProperty: async (propertyId: string, data: Partial<Property>) => {
    // If status needs to change standalone (rare now that we can update all)
    if (data.status && Object.keys(data).length === 1) {
      const response = await api.put(`/v1/admin/properties/${propertyId}/status`, {
        status: mapStatusToApi(data.status),
      })
      return response.data?.data ?? response.data
    }

    // Convert status to API format if provided
    const payload = { ...data }
    if (payload.status) {
      (payload as any).status = mapStatusToApi(payload.status)
    }

    const response = await api.put(`/v1/admin/properties/${propertyId}`, payload)
    return response.data?.data ?? response.data
  },

  deleteProperty: async (propertyId: string) => {
    const response = await api.delete(`/v1/admin/properties/${propertyId}`)
    return response.data?.data ?? response.data
  },

  listCities: async () => {
    const response = await api.get('/v1/properties/cities')
    return response.data?.data ?? response.data
  },

  createProperty: async (data: Partial<Property>) => {
    const response = await api.post('/v1/admin/properties', data)
    return response.data?.data ?? response.data
  },

  updateRoom: async (roomId: string, data: { pricePerNight?: number; weekendPrice?: number; totalRooms?: number; availableRooms?: number, isActive?: boolean }) => {
    const response = await api.put(`/v1/admin/rooms/${roomId}`, data)
    return response.data?.data ?? response.data
  },

  blockRoomDates: async (roomId: string, data: { checkInDate: string; checkOutDate: string; quantity?: number; notes?: string }) => {
    const response = await api.post(`/v1/admin/rooms/${roomId}/block`, data)
    return response.data?.data ?? response.data
  },

  setCancellationPolicy: async (propertyId: string, policy: 'FREE_CANCELLATION' | 'MODERATE' | 'STRICT' | 'NON_REFUNDABLE') => {
    const response = await api.put(`/v1/admin/properties/${propertyId}`, { cancellationPolicy: policy })
    return response.data?.data ?? response.data
  },

  publishProperty: async (propertyId: string, publish: boolean) => {
    const response = await api.put(`/v1/admin/properties/${propertyId}/status`, { status: publish ? 'ACTIVE' : 'INACTIVE' })
    return response.data?.data ?? response.data
  },
}
