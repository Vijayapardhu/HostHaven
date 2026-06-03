import api from "@/lib/api";

const getData = (response: any) => response?.data?.data ?? response?.data ?? response;

export const notificationsService = {
  getNotifications: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/vendor/notifications", { params });
    return getData(response.data);
  },

  markRead: async (id: string) => {
    const response = await api.put(`/v1/vendor/notifications/${id}/read`);
    return getData(response.data);
  },

  markAllRead: async () => {
    const response = await api.put("/v1/vendor/notifications/read-all", {});
    return getData(response.data);
  },
};
