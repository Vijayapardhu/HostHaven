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
      isApproved: params?.status === 'approved' ? true : params?.status === 'pending' ? false : undefined,
    } })
    return normalizeListResponse(response.data)
  },

  getVendorById: async (id: string) => {
    const response = await api.get(`/v1/vendor`, { params: { page: 1, limit: 1 } })
    const normalized = normalizeListResponse(response.data)
    return normalized.data.find((item: Vendor) => item.id === id)
  },

  getPendingVendors: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/v1/vendor', {
      params: { page: params?.page, limit: params?.limit, isApproved: false },
    })
    return normalizeListResponse(response.data)
  },

  approveVendor: async (vendorId: string, notes?: string) => {
    const response = await api.put(`/v1/vendor/${vendorId}/approve`, { notes })
    return response.data?.data ?? response.data
  },

  rejectVendor: async (vendorId: string, notes?: string) => {
    throw new Error('Vendor rejection endpoint is not available on the backend')
  },

  suspendVendor: async (vendorId: string, reason?: string) => {
    throw new Error('Vendor suspension endpoint is not available on the backend')
  },

  activateVendor: async (vendorId: string) => {
    const response = await api.put(`/v1/vendor/${vendorId}/approve`)
    return response.data?.data ?? response.data
  },

  setCommission: async (vendorId: string, commissionRate: number) => {
    throw new Error('Commission update endpoint is not available on the backend')
  },
}
