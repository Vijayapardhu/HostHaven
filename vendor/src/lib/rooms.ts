import api from "@/lib/api";

const getData = (response: any) => response?.data?.data ?? response?.data ?? response;

export const roomsService = {
  getRooms: async (propertyId?: string) => {
    const url = propertyId ? `/v1/rooms/property/${propertyId}` : "/v1/rooms";
    const response = await api.get(url);
    return getData(response.data);
  },

  getRoomById: async (id: string) => {
    const response = await api.get(`/v1/rooms/${id}`);
    return getData(response.data);
  },

  createRoom: async (data: unknown) => {
    const response = await api.post("/v1/rooms", data);
    return getData(response.data);
  },

  updateRoom: async (id: string, data: unknown) => {
    const response = await api.put(`/v1/rooms/${id}`, data);
    return getData(response.data);
  },

  deleteRoom: async (id: string) => {
    const response = await api.delete(`/v1/rooms/${id}`);
    return getData(response.data);
  },
};
