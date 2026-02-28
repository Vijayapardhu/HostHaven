import api from "@/lib/api";

export const reviewsService = {
  getReviews: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/reviews/vendor", { params });
    return response.data?.data || response.data;
  },

  getReviewsByProperty: async (propertyId: string) => {
    const response = await api.get("/v1/reviews/vendor", {
      params: { propertyId },
    });
    return response.data?.data || response.data;
  },

  respondToReview: async (reviewId: string, responseText: string) => {
    const apiResponse = await api.post(
      `/v1/reviews/vendor/${reviewId}/respond`,
      { responseText },
    );
    return apiResponse.data?.data || apiResponse.data;
  },
};
