import api from "@/lib/api";

export const roomsService = {
  getRooms: async (propertyId: string) => {
    const response = await api.get(`/v1/vendor/properties/${propertyId}/rooms`);
    return response.data?.rooms ?? response.data;
  },

  getRoomById: async (_propertyId: string, roomId: string) => {
    // Note: the backend may or may not have a specific vendor-scoped getRoom by id, but we can just use the rooms array or public endpoint or add it.
    // For now we'll fetch from the public endpoint or assume vendor getRooms is enough.
    const response = await api.get(`/v1/rooms/${roomId}`);
    return response.data;
  },

  createRoom: async (propertyId: string, data: unknown) => {
    const response = await api.post(`/v1/vendor/properties/${propertyId}/rooms`, data);
    return response.data;
  },

  updateRoom: async (propertyId: string, roomId: string, data: unknown) => {
    const response = await api.put(`/v1/vendor/properties/${propertyId}/rooms/${roomId}`, data);
    return response.data;
  },

  deleteRoom: async (propertyId: string, roomId: string) => {
    const response = await api.delete(`/v1/vendor/properties/${propertyId}/rooms/${roomId}`);
    return response.data;
  },
};
