import api from "@/lib/api";

const getData = (response: any) => response?.data?.data ?? response?.data ?? response;

export const supportService = {
  getMyTickets: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/support/tickets/my", { params });
    return getData(response.data);
  },

  getTicketById: async (id: string) => {
    const response = await api.get(`/v1/support/tickets/my/${id}`);
    return getData(response.data);
  },

  createTicket: async (data: {
    category: string;
    message: string;
    bookingReference?: string;
    attachmentUrl?: string;
  }) => {
    const response = await api.post("/v1/support/tickets", data);
    return getData(response.data);
  },
};
