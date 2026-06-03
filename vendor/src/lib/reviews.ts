import api from "@/lib/api";

const getData = (response: any) => response?.data?.data ?? response?.data ?? response;

export const reviewsService = {
  getReviews: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/reviews/vendor", { params });
    return getData(response.data);
  },

  getReviewsByProperty: async (propertyId: string) => {
    const response = await api.get("/v1/reviews/vendor", {
      params: { propertyId },
    });
    return getData(response.data);
  },

  respondToReview: async (reviewId: string, responseText: string) => {
    const apiResponse = await api.post(`/v1/reviews/vendor/${reviewId}/respond`, { response: responseText });
    return getData(apiResponse.data);
  },
};
