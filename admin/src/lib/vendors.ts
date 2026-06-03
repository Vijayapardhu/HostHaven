import api from './api'

export interface Vendor {
  id: string
  email: string
  phone: string
  name?: string
  businessName: string
  businessType: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  applicationStatus?: string
  isApproved: boolean
  commissionRate: number
  propertiesCount?: number
  bookingsCount?: number
  businessAddress?: string
  gstNumber?: string
  panNumber?: string
  aadhaarNumber?: string
  passportPhoto?: string
  companyLogo?: string
  rejectionReason?: string
  totalEarnings?: number
  user?: {
    name?: string
    email?: string
    phone?: string
  }
  bankAccount?: {
    bankName: string
    accountNumber: string
    ifscCode: string
    accountHolderName: string
  }
  payouts?: any[]
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
    city: string
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
  const rawStatus = String(vendor.applicationStatus ?? vendor.status ?? '').toUpperCase()
  const status: Vendor['status'] =
    rawStatus === 'APPROVED'
      ? 'approved'
      : rawStatus === 'REJECTED'
      ? 'rejected'
      : rawStatus === 'SUSPENDED'
      ? 'suspended'
      : 'pending'

  const isApproved = status === 'approved' || Boolean(vendor.isApproved)
  return {
    id: vendor.id,
    email: vendor.user?.email ?? vendor.email ?? '',
    phone: vendor.user?.phone ?? vendor.phone ?? '',
    name: vendor.user?.name ?? vendor.name,
    businessName: vendor.businessName ?? 'Vendor',
    businessType: vendor.businessType ?? 'Business',
    status,
    applicationStatus: vendor.applicationStatus ?? vendor.status,
    isApproved,
    commissionRate: Number(vendor.commissionRate ?? 0),
    propertiesCount: Number(vendor.propertiesCount ?? vendor._count?.properties ?? 0),
    bookingsCount: Number(vendor.bookingsCount ?? vendor._count?.bookings ?? 0),
    businessAddress: vendor.businessAddress,
    gstNumber: vendor.gstNumber,
    panNumber: vendor.panNumber,
    aadhaarNumber: vendor.aadhaarNumber,
    passportPhoto: vendor.passportPhoto,
    companyLogo: vendor.companyLogo,
    rejectionReason: vendor.rejectionReason,
    totalEarnings: vendor.totalEarnings,
    user: vendor.user ? { name: vendor.user.name, email: vendor.user.email, phone: vendor.user.phone } : undefined,
    bankAccount: vendor.bankAccount,
    payouts: vendor.payouts,
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
    const response = await api.get('/v1/admin/vendors', { params: {
      page: params?.page,
      limit: params?.limit,
      search: params?.search || undefined,
      status: params?.status?.toUpperCase() || undefined,
    } })
    return normalizeListResponse(response.data)
  },

  getVendorById: async (id: string) => {
    const response = await api.get(`/v1/admin/vendors/${id}`)
    const payload = response.data?.data ?? response.data
    return mapVendor(payload)
  },

  getPendingVendors: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/v1/admin/vendors', {
      params: { page: params?.page, limit: params?.limit, status: 'PENDING' },
    })
    return normalizeListResponse(response.data)
  },

  approveVendor: async (vendorId: string, notes?: string) => {
    const response = await api.put(`/v1/admin/vendors/${vendorId}/status`, {
      status: 'APPROVED',
      reason: notes,
    })
    return response.data?.data ?? response.data
  },

  rejectVendor: async (vendorId: string, notes?: string) => {
    const response = await api.put(`/v1/admin/vendors/${vendorId}/status`, {
      status: 'REJECTED',
      reason: notes,
    })
    return response.data?.data ?? response.data
  },

  suspendVendor: async (vendorId: string, reason?: string) => {
    const response = await api.put(`/v1/admin/vendors/${vendorId}/status`, {
      status: 'SUSPENDED',
      reason,
    })
    return response.data?.data ?? response.data
  },

  activateVendor: async (vendorId: string) => {
    const response = await api.put(`/v1/admin/vendors/${vendorId}/status`, {
      status: 'APPROVED',
    })
    return response.data?.data ?? response.data
  },

  setCommission: async (vendorId: string, commissionRate: number) => {
    const response = await api.put(`/v1/admin/vendors/${vendorId}/commission`, {
      commissionRate,
    })
    return response.data?.data ?? response.data
  },

  createOnboardingVendor: async (payload: AdminVendorOnboardingPayload) => {
    const response = await api.post('/v1/vendor/admin/onboarding', payload)
    return response.data?.data ?? response.data
  },

  deleteVendor: async (vendorId: string) => {
    const response = await api.delete(`/v1/admin/vendors/${vendorId}`)
    return response.data?.data ?? response.data
  },

  updateVendor: async (vendorId: string, data: Record<string, unknown>) => {
    const response = await api.put(`/v1/admin/vendors/${vendorId}`, data)
    return response.data?.data ?? response.data
  },
}
