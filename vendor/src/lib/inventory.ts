import api from "@/lib/api";

export const inventoryService = {
  getInventory: async (roomTypeId: string) => {
    const response = await api.get("/v1/bookings/vendor/inventory", {
      params: { roomTypeId },
    });
    return response.data;
  },

  getRoomInventory: async (date?: string) => {
    const response = await api.get("/v1/bookings/vendor/inventory", {
      params: date ? { date } : undefined,
    });
    return response.data?.inventory ?? response.data;
  },

  blockDate: async (data: { roomTypeId: string; date: string; reason?: string }) => {
    const response = await api.post("/v1/vendor/inventory/block-date", data);
    return response.data;
  },

  unblockDate: async (data: { roomTypeId: string; date: string }) => {
    const response = await api.post("/v1/vendor/inventory/unblock-date", data);
    return response.data;
  },

  blockDates: async (data: {
    roomId?: string;
    propertyId?: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) => {
    const response = await api.post("/v1/vendor/inventory/block-dates", data);
    return response.data;
  },
};
