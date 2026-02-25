import api from "@/lib/api";

export const reviewsService = {
  getReviews: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/vendor/reviews", { params });
    return response.data;
  },

  getReviewsByProperty: async (propertyId: string) => {
    const response = await api.get("/v1/vendor/reviews", {
      params: { propertyId },
    });
    return response.data?.reviews ?? response.data;
  },
};
