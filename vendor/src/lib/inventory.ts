import api from "@/lib/api";

const getData = (response: any) => response?.data?.data ?? response?.data ?? response;

export const inventoryService = {
  getInventory: async (roomTypeId: string) => {
    const response = await api.get("/v1/bookings/vendor/inventory", {
      params: { roomTypeId },
    });
    return getData(response.data);
  },

  getRoomInventory: async (date?: string) => {
    const response = await api.get("/v1/bookings/vendor/inventory", {
      params: date ? { date } : undefined,
    });
    const data = getData(response.data);
    return data?.inventory ?? data;
  },

  blockDate: async (data: { roomTypeId: string; date: string; reason?: string }) => {
    const response = await api.post("/v1/vendor/inventory/block-date", data);
    return getData(response.data);
  },

  unblockDate: async (data: { roomTypeId: string; date: string }) => {
    const response = await api.post("/v1/vendor/inventory/unblock-date", data);
    return getData(response.data);
  },

  blockDates: async (data: {
    roomId?: string;
    propertyId?: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) => {
    const response = await api.post("/v1/vendor/inventory/block-dates", data);
    return getData(response.data);
  },
};
