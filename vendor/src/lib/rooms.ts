import api from "@/lib/api";

export const roomsService = {
  getRooms: async (propertyId?: string) => {
    const response = await api.get("/v1/vendor/rooms", {
      params: propertyId ? { propertyId } : undefined,
    });
    return response.data?.rooms ?? response.data;
  },

  getRoomById: async (id: string) => {
    const response = await api.get(`/v1/vendor/rooms/${id}`);
    return response.data;
  },

  createRoom: async (data: unknown) => {
    const response = await api.post("/v1/vendor/rooms", data);
    return response.data;
  },

  updateRoom: async (id: string, data: unknown) => {
    const response = await api.patch(`/v1/vendor/rooms/${id}`, data);
    return response.data;
  },

  deleteRoom: async (id: string) => {
    const response = await api.delete(`/v1/vendor/rooms/${id}`);
    return response.data;
  },
};
