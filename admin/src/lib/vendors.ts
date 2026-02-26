import api from './api'

export interface Vendor {
  id: string
  email: string
  phone: string
  businessName: string
  businessType: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  isApproved: boolean
  commissionRate: number
  payoutDetails?: {
    upiId?: string
    bankAccount?: string
    bankName?: string
    ifsc?: string
  }
  hotelId?: string
  createdAt: string
  updatedAt: string
}

export interface VendorApprovalRequest {
  vendorId: string
  status: 'approved' | 'rejected'
  notes?: string
}

export interface AdminVendorOnboardingPayload {
  account: {
    fullName: string
    email: string
    password: string
    phoneNumber: string
    businessName: string
  }
  businessInfo: {
    businessAddress: string
    city: 'VIJAYAWADA' | 'NANDIYALA' | 'VETLAPALEM' | 'TIRUPATI'
    state: string
    pincode: string
    gstNumber?: string
    panNumber?: string
  }
  payout: {
    bankName: string
    accountHolderName: string
    accountNumber: string
    ifscCode: string
    upiId?: string
  }
  hotel: {
    hotelName: string
    slug: string
    description: string
    shortDescription: string
    fullAddress: string
    latitude: number
    longitude: number
    amenities: string[]
    highlights?: string[]
    images: Array<{ url: string; alt?: string; isPrimary?: boolean }>
    videos: string[]
    basePrice: number
  }
  rooms: Array<{
    roomName: string
    capacity: number
    extraBedCapacity: number
    pricePerNight: number
    weekendPrice?: number
    totalRooms: number
    roomAmenities: string[]
    roomImages: string[]
  }>
  inventory: {
    totalRoomsAvailable: number
    blockDates?: Array<{ date: string; blockedRooms?: number }>
  }
  legal: {
    acceptTerms: true
    acceptCommission: true
    acceptRefundPolicy: true
  }
  adminControls?: {
    commissionRate?: number
    approvalStatus?: 'DRAFT' | 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED'
    suspensionStatus?: boolean
    vendorApproved?: boolean
  }
}

const mapVendor = (vendor: any): Vendor => {
  const isApproved = Boolean(vendor.isApproved)
  return {
    id: vendor.id,
    email: vendor.user?.email ?? vendor.email ?? '',
    phone: vendor.user?.phone ?? vendor.phone ?? '',
    businessName: vendor.businessName ?? 'Vendor',
    businessType: vendor.businessType ?? 'Business',
    status: isApproved ? 'approved' : 'pending',
    isApproved,
    commissionRate: Number(vendor.commissionRate ?? 0),
    payoutDetails: vendor.payoutDetails,
    hotelId: vendor.hotelId,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt ?? vendor.createdAt,
  }
}

const normalizeListResponse = (payload: any) => {
  const data = payload?.data ?? payload?.vendors ?? []
  const meta = payload?.meta ?? payload?.pagination
  return {
    data: Array.isArray(data) ? data.map(mapVendor) : [],
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

export const vendorsService = {
  getVendors: async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }) => {
    const response = await api.get('/v1/vendor', { params: {
      page: params?.page,
      limit: params?.limit,
      search: params?.search,
      status: params?.status?.toUpperCase(),
    } })
    return normalizeListResponse(response.data)
  },

  getVendorById: async (id: string) => {
    const response = await api.get(`/v1/vendor`, { params: { page: 1, limit: 1, search: id } })
    const normalized = normalizeListResponse(response.data)
    return normalized.data.find((item: Vendor) => item.id === id)
  },

  getPendingVendors: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/v1/vendor', {
      params: { page: params?.page, limit: params?.limit, status: 'PENDING' },
    })
    return normalizeListResponse(response.data)
  },

  approveVendor: async (vendorId: string, notes?: string) => {
    const response = await api.put(`/v1/vendor/${vendorId}/approve`, { notes })
    return response.data?.data ?? response.data
  },

  rejectVendor: async (_vendorId: string, _notes?: string) => {
    throw new Error('Vendor rejection endpoint is not available on the backend')
  },

  suspendVendor: async (_vendorId: string, _reason?: string) => {
    throw new Error('Vendor suspension endpoint is not available on the backend')
  },

  activateVendor: async (vendorId: string) => {
    const response = await api.put(`/v1/vendor/${vendorId}/approve`)
    return response.data?.data ?? response.data
  },

  setCommission: async (_vendorId: string, _commissionRate: number) => {
    throw new Error('Commission update endpoint is not available on the backend')
  },

  createOnboardingVendor: async (payload: AdminVendorOnboardingPayload) => {
    const response = await api.post('/v1/vendor/admin/onboarding', payload)
    return response.data?.data ?? response.data
  },
}
