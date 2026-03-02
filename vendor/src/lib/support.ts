import api from "@/lib/api";

export const supportService = {
  getMyTickets: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/support/tickets/my", { params });
    return response.data;
  },

  createTicket: async (data: {
    category: string;
    message: string;
    bookingReference?: string;
    attachmentUrl?: string;
  }) => {
    const response = await api.post("/v1/support/tickets", data);
    return response.data;
  },
};
