import api from "./api";

export interface Review {
  id: string;
  bookingId?: string;
  propertyId: string;
  propertyName?: string;
  propertyType?: string;
  propertyCity?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  cleanliness?: number;
  service?: number;
  location?: number;
  value?: number;
  images?: string[];
  videos?: string[];
  isVerified: boolean;
  isVisible: boolean;
  vendorResponse?: string;
  respondedAt?: string;
  status: "approved" | "pending" | "rejected" | "hidden";
  createdAt: string;
  updatedAt: string;
}

const deriveStatus = (review: any): Review["status"] => {
  if (review?.isVisible === false) return "hidden";
  if (review?.isVerified === false) return "pending";
  return "approved";
};

const mapReview = (review: any): Review => ({
  id: review.id,
  bookingId: review.bookingId,
  propertyId: review.property?.id ?? review.propertyId,
  propertyName: review.property?.name,
  propertyType: review.property?.type,
  propertyCity: review.property?.city,
  userId: review.user?.id ?? review.userId,
  userName: review.user?.name ?? "User",
  userEmail: review.user?.email,
  userAvatar: review.user?.avatarUrl,
  rating: review.rating ?? 0,
  title: review.title ?? "",
  comment: review.comment ?? "",
  cleanliness: review.cleanliness,
  service: review.service,
  location: review.location,
  value: review.value,
  images: review.images,
  videos: review.videos,
  isVerified: review.isVerified ?? false,
  isVisible: review.isVisible ?? true,
  vendorResponse: review.vendorResponse,
  respondedAt: review.respondedAt,
  status: deriveStatus(review),
  createdAt: review.createdAt,
  updatedAt: review.updatedAt ?? review.createdAt,
});

const normalizeList = (payload: any) => {
  const data = payload?.data ?? payload?.reviews ?? [];
  const meta = payload?.meta ?? payload?.pagination;
  return {
    data: Array.isArray(data) ? data.map(mapReview) : [],
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

export const reviewsService = {
  getReviews: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    rating?: number;
    status?: string;
    propertyId?: string;
  }) => {
    // Use admin endpoint to see ALL reviews including hidden
    const response = await api.get("/v1/admin/reviews", {
      params: {
        page: params?.page,
        limit: params?.limit,
        rating: params?.rating,
        propertyId: params?.propertyId,
        isVisible:
          params?.status === "hidden"
            ? "false"
            : params?.status === "approved"
              ? "true"
              : undefined,
        isVerified: params?.status === "pending" ? "false" : undefined,
      },
    });
    const normalized = normalizeList(response.data);
    let filtered = normalized.data;
    if (params?.status && params.status !== "all") {
      filtered = filtered.filter((r) => r.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((r) =>
        [r.userName, r.title, r.comment, r.propertyName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return { ...normalized, data: filtered };
  },

  getReviewById: async (id: string) => {
    const response = await api.get(`/v1/reviews/${id}`);
    return mapReview(response.data?.data ?? response.data);
  },

  hideReview: async (id: string) => {
    const response = await api.put(`/v1/admin/reviews/${id}/hide`);
    return mapReview(response.data?.data ?? response.data);
  },

  unhideReview: async (id: string) => {
    const response = await api.put(`/v1/admin/reviews/${id}/unhide`);
    return mapReview(response.data?.data ?? response.data);
  },

  verifyReview: async (id: string) => {
    const response = await api.put(`/v1/admin/reviews/${id}/verify`);
    return mapReview(response.data?.data ?? response.data);
  },

  approveReview: async (id: string) => {
    // Approve = verify + unhide
    await api.put(`/v1/admin/reviews/${id}/verify`);
    const response = await api.put(`/v1/admin/reviews/${id}/unhide`);
    return mapReview(response.data?.data ?? response.data);
  },

  rejectReview: async (id: string) => {
    const response = await api.put(`/v1/admin/reviews/${id}/hide`);
    return mapReview(response.data?.data ?? response.data);
  },

  deleteReview: async (id: string) => {
    const response = await api.delete(`/v1/admin/reviews/${id}`);
    return response.data?.data ?? response.data;
  },

  updateReviewContent: async (
    id: string,
    data: { title?: string; comment?: string },
  ) => {
    const response = await api.put(`/v1/admin/reviews/${id}`, data);
    return mapReview(response.data?.data ?? response.data);
  },
};
