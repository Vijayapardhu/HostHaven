import api from "@/lib/api";

export interface InventoryItem {
  id: string;
  roomId: string;
  roomName: string;
  date: string;
  totalRooms: number;
  bookedRooms: number;
  availableRooms: number;
  isBlocked: boolean;
  blockReason?: string;
}

export const inventoryService = {
  getInventory: async (roomId?: string, date?: string) => {
    const response = await api.get("/v1/vendor/inventory", {
      params: { roomId, date },
    });
    return response.data?.inventory ?? response.data;
  },

  getRoomInventory: async (date?: string) => {
    const response = await api.get("/v1/vendor/inventory", {
      params: date ? { date } : undefined,
    });
    return response.data?.inventory ?? response.data;
  },

  blockDate: async (data: {
    roomTypeId: string;
    date: string;
    reason?: string;
  }) => {
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

  block: async (data: {
    roomId: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) => {
    const response = await api.post("/v1/vendor/inventory/block", data);
    return response.data;
  },

  updateInventory: async (data: {
    roomId: string;
    date: string;
    availableRooms: number;
  }) => {
    const response = await api.put("/v1/vendor/inventory/update", data);
    return response.data;
  },

  unblock: async (data: {
    roomId: string;
    startDate: string;
    endDate: string;
  }) => {
    const response = await api.post("/v1/vendor/inventory/unblock", data);
    return response.data;
  },
};
