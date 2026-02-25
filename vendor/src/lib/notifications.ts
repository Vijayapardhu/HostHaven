import api from "@/lib/api";

export const notificationsService = {
  getNotifications: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/vendor/notifications", { params });
    return response.data;
  },

  markRead: async (id: string) => {
    const response = await api.patch(`/v1/vendor/notifications/${id}/read`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.patch("/v1/vendor/notifications/read-all");
    return response.data;
  },
};
