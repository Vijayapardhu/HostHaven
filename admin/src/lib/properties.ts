import api from './api'

export interface Property {
  id: string
  slug?: string
  name: string
  type: 'hotel' | 'home' | 'temple'
  city: string
  state?: string
  pincode?: string
  address: string
  description?: string
  shortDesc?: string
  searchText?: string
  amenities?: string[]
  highlights?: string[]
  images?: any[]
  video?: string
  videos?: any[]
  virtualTourUrl?: string
  mapLocation?: { lat: number; lng: number }
  latitude?: number
  longitude?: number
  pricing?: {
    basePrice: number
    weekendPrice?: number
  }
  basePrice?: number
  currency?: string
  status: 'pending' | 'approved' | 'inactive' | 'rejected' | 'draft'
  vendorId?: string
  rating?: number
  reviewCount?: number
  bookingCount?: number
  bookingsCount?: number
  viewCount?: number
  isFeatured?: boolean
  isVerified?: boolean
  metaTitle?: string
  metaDesc?: string
  featureFlags?: Record<string, unknown>
  houseDetails?: Record<string, unknown>
  cancellationPolicy?: any
  rooms?: any[]
  rejectionReason?: string
  templeDetails?: any
  createdAt: string
  updatedAt: string
}

export interface PropertyMedia {
  url: string
  alt?: string
  isPrimary?: boolean
  type?: string
}

export interface PropertyRoom {
  id?: string
  name: string
  description?: string
  type: string
  capacity: number
  extraBedCapacity?: number
  pricePerNight: number
  weekendPrice?: number
  totalRooms: number
  availableRooms?: number
  amenities?: string[]
  images?: string[]
  video?: string
}

const normalizeStatus = (status?: string): Property['status'] => {
  if (!status) return 'pending'
  const value = status.toUpperCase()
  if (value === 'DRAFT') return 'draft'
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
  if (status === 'draft') return 'DRAFT'
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
  slug: property.slug,
  name: property.name,
  type: normalizeType(property.type),
  city: property.city ?? property.state ?? '',
  state: property.state,
  pincode: property.pincode,
  address: property.address ?? '',
  description: property.description,
  shortDesc: property.shortDesc,
  amenities: property.amenities,
  highlights: property.highlights,
  images: property.images,
  video: property.video || property.videos?.[0],
  videos: property.videos,
  virtualTourUrl: property.virtualTourUrl,
  mapLocation: property.mapLocation || { lat: property.latitude, lng: property.longitude },
  latitude: property.latitude,
  longitude: property.longitude,
  pricing: property.pricing || { basePrice: property.basePrice, weekendPrice: property.weekendPrice },
  basePrice: property.basePrice,
  currency: property.currency,
  status: normalizeStatus(property.status),
  vendorId: property.vendor?.id ?? property.vendorId,
  rating: property.rating,
  reviewCount: property.reviewCount,
  bookingCount: property.bookingCount,
  viewCount: property.viewCount,
  isFeatured: property.isFeatured,
  isVerified: property.isVerified,
  metaTitle: property.metaTitle,
  metaDesc: property.metaDesc,
  featureFlags: property.featureFlags,
  cancellationPolicy: property.cancellationPolicy,
  rooms: property.rooms,
  rejectionReason: property.rejectionReason,
  templeDetails: property.templeDetails,
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
        search: params?.search || undefined,
        status: mapStatusToApi(params?.status),
        type: mapTypeToApi(params?.type),
        city: params?.city || undefined,
        vendorId: params?.vendorId || undefined,
      },
    })
    return normalizeList(response.data)
  },

  getPropertyById: async (id: string) => {
    const response = await api.get(`/v1/admin/properties/${id}`)
    const payload = response.data?.data ?? response.data
    return mapProperty(payload)
  },

  getPropertyBySlug: async (slug: string) => {
    const response = await api.get(`/v1/admin/properties/${encodeURIComponent(slug)}`)
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

  updateProperty: async (propertyId: string, data: any) => {
    const { status, ...rest } = data

    let result
    if (Object.keys(rest).length > 0) {
      const response = await api.put(`/v1/admin/properties/${propertyId}`, rest)
      result = response.data?.data ?? response.data
    }

    if (status) {
      const response = await api.put(`/v1/admin/properties/${propertyId}/status`, {
        status: mapStatusToApi(status),
      })
      result = response.data?.data ?? response.data
    }

    return result
  },

  setCancellationPolicy: async (propertyId: string, policyType: string) => {
    const response = await api.put(`/v1/admin/properties/${propertyId}/cancellation-policy`, {
      cancellationPolicy: policyType,
    })
    return response.data?.data ?? response.data
  },

  deleteProperty: async (propertyId: string) => {
    const response = await api.delete(`/v1/properties/${propertyId}`)
    return response.data?.data ?? response.data
  },

  listCities: async () => {
    const response = await api.get('/v1/properties/cities')
    return response.data?.data ?? response.data
  },

  getCityNames: async () => {
    const response = await api.get('/v1/properties/cities/list')
    return response.data?.data ?? response.data ?? []
  },

  getAmenityNames: async () => {
    const response = await api.get('/v1/properties/amenities')
    return response.data?.data ?? response.data ?? []
  },

  createAmenity: async (name: string) => {
    const response = await api.post('/v1/properties/amenities', { name })
    return response.data?.data ?? response.data
  },

  createProperty: async (data: any) => {
    const response = await api.post('/v1/admin/properties', data)
    return response.data?.data ?? response.data
  },

  updateRoom: async (roomId: string, data: { pricePerNight?: number; weekendPrice?: number; availableRooms?: number; images?: string[]; video?: string }) => {
    const response = await api.put(`/v1/admin/rooms/${roomId}`, data)
    return response.data?.data ?? response.data
  },

  blockRoomDates: async (roomId: string, data: { checkInDate: string; checkOutDate: string; quantity?: number }) => {
    const response = await api.post(`/v1/admin/rooms/${roomId}/block`, data)
    return response.data?.data ?? response.data
  },

  getAllAmenities: async () => {
    const response = await api.get('/v1/admin/amenities')
    return response.data?.data ?? response.data ?? []
  },

  toggleAmenity: async (name: string, isActive: boolean) => {
    const response = await api.put('/v1/admin/amenities/toggle', { name, isActive })
    return response.data?.data ?? response.data
  },

  getAllCities: async () => {
    const response = await api.get('/v1/admin/cities')
    return response.data?.data ?? response.data ?? []
  },

  toggleCity: async (name: string, isActive: boolean) => {
    const response = await api.put('/v1/admin/cities/toggle', { name, isActive })
    return response.data?.data ?? response.data
  },

  createCity: async (name: string) => {
    const response = await api.post('/v1/admin/cities', { name })
    return response.data?.data ?? response.data
  },
}
