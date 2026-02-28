import api from "./api";

export interface Vendor {
  id: string;
  email: string;
  phone: string;
  businessName: string;
  businessAddress?: string;
  gstNumber?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  passportPhoto?: string;
  companyLogo?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  isApproved: boolean;
  commissionRate: number;
  payoutDetails?: {
    upiId?: string;
    bankAccount?: string;
    bankName?: string;
    ifsc?: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  propertiesCount?: number;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  totalEarnings?: string;
  payouts?: Array<{
    id: string;
    amount: string;
    status: string;
    createdAt: string;
  }>;
}

export interface VendorApprovalRequest {
  vendorId: string;
  status: "approved" | "rejected";
  notes?: string;
}

export interface AdminVendorOnboardingPayload {
  account: {
    fullName: string;
    email: string;
    password: string;
    phoneNumber: string;
    businessName: string;
  };
  businessInfo: {
    businessAddress: string;
    city: "VIJAYAWADA" | "NANDIYALA" | "VETLAPALEM" | "TIRUPATI";
    state: string;
    pincode: string;
    gstNumber?: string;
    panNumber?: string;
  };
  payout: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    upiId?: string;
  };
  hotel: {
    hotelName: string;
    slug: string;
    description: string;
    shortDescription: string;
    fullAddress: string;
    latitude: number;
    longitude: number;
    amenities: string[];
    highlights?: string[];
    images: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
    videos: string[];
    basePrice: number;
  };
  rooms: Array<{
    roomName: string;
    capacity: number;
    extraBedCapacity: number;
    pricePerNight: number;
    weekendPrice?: number;
    totalRooms: number;
    roomAmenities: string[];
    roomImages: string[];
  }>;
  inventory: {
    totalRoomsAvailable: number;
    blockDates?: Array<{ date: string; blockedRooms?: number }>;
  };
  legal: {
    acceptTerms: true;
    acceptCommission: true;
    acceptRefundPolicy: true;
  };
  adminControls?: {
    commissionRate?: number;
    approvalStatus?: "DRAFT" | "PENDING" | "ACTIVE" | "INACTIVE" | "REJECTED";
    suspensionStatus?: boolean;
    vendorApproved?: boolean;
  };
}

const mapVendor = (vendor: any): Vendor => {
  const isApproved = Boolean(vendor.isApproved);
  return {
    id: vendor.id,
    email: vendor.user?.email ?? vendor.email ?? "",
    phone: vendor.user?.phone ?? vendor.phone ?? "",
    businessName: vendor.businessName ?? "Vendor",
    businessAddress: vendor.businessAddress,
    gstNumber: vendor.gstNumber,
    panNumber: vendor.panNumber,
    aadhaarNumber: vendor.aadhaarNumber,
    passportPhoto: vendor.passportPhoto,
    companyLogo: vendor.companyLogo,
    status: isApproved ? "approved" : "pending",
    isApproved,
    commissionRate: Number(vendor.commissionRate ?? 0),
    payoutDetails: vendor.payoutDetails,
    user: vendor.user
      ? {
        id: vendor.user.id,
        name: vendor.user.name,
        email: vendor.user.email,
        phone: vendor.user.phone,
        avatarUrl: vendor.user.avatarUrl,
      }
      : undefined,
    propertiesCount: vendor.propertiesCount ?? vendor._count?.properties,
    approvedAt: vendor.approvedAt,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt ?? vendor.createdAt,
    totalEarnings: vendor.totalEarnings,
    payouts: vendor.payouts,
  };
};

const normalizeListResponse = (payload: any) => {
  const data = payload?.data ?? payload?.vendors ?? [];
  const meta = payload?.meta ?? payload?.pagination;
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
  };
};

export const vendorsService = {
  getVendors: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const response = await api.get("/v1/vendor", {
      params: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search,
        status: params?.status?.toUpperCase(),
      },
    });
    return normalizeListResponse(response.data);
  },

  getVendorById: async (id: string) => {
    const response = await api.get(`/v1/vendor`, {
      params: { page: 1, limit: 1, search: id },
    });
    const normalized = normalizeListResponse(response.data);
    return normalized.data.find((item: Vendor) => item.id === id);
  },

  getPendingVendors: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get("/v1/vendor", {
      params: { page: params?.page, limit: params?.limit, status: "PENDING" },
    });
    return normalizeListResponse(response.data);
  },

  approveVendor: async (vendorId: string, notes?: string) => {
    const response = await api.put(`/v1/vendor/${vendorId}/approve`, { notes });
    return response.data?.data ?? response.data;
  },

  rejectVendor: async (vendorId: string, notes?: string) => {
    const response = await api.put(`/v1/admin/vendors/${vendorId}/status`, { status: "REJECTED", reason: notes });
    return response.data?.data ?? response.data;
  },

  suspendVendor: async (vendorId: string, reason?: string) => {
    const response = await api.put(`/v1/admin/vendors/${vendorId}/status`, { status: "SUSPENDED", reason });
    return response.data?.data ?? response.data;
  },

  activateVendor: async (vendorId: string) => {
    const response = await api.put(`/v1/admin/vendors/${vendorId}/status`, { status: "APPROVED" });
    return response.data?.data ?? response.data;
  },

  setCommission: async (vendorId: string, commissionRate: number) => {
    const response = await api.put(`/v1/admin/vendors/${vendorId}/commission`, { rate: commissionRate });
    return response.data?.data ?? response.data;
  },

  createOnboardingVendor: async (payload: AdminVendorOnboardingPayload) => {
    const response = await api.post("/v1/vendor/admin/onboarding", payload);
    return response.data?.data ?? response.data;
  },

  updateVendor: async (vendorId: string, payload: any) => {
    const response = await api.put(`/v1/admin/vendors/${vendorId}`, payload);
    return response.data?.data ?? response.data;
  },

  deleteVendor: async (vendorId: string) => {
    const response = await api.delete(`/v1/admin/vendors/${vendorId}`);
    return response.data?.data ?? response.data;
  },
};
