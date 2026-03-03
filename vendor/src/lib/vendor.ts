import api from "@/lib/api";

export const vendorService = {
  login: async (email: string, password: string) => {
    const response = await api.post("/v1/vendor/login", { email, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/v1/vendor/profile");
    return response.data;
  },

  updateProfile: async (data: unknown) => {
    const response = await api.put("/v1/vendor/profile", data);
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get("/v1/vendor/dashboard");
    return response.data;
  },

  getProperties: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/vendor/properties", { params });
    return response.data;
  },

  getPropertyById: async (id: string) => {
    const response = await api.get(`/v1/properties/${id}`);
    return response.data;
  },

  createProperty: async (data: unknown) => {
    const response = await api.post("/v1/properties", data);
    return response.data;
  },

  updateProperty: async (id: string, data: unknown) => {
    const response = await api.put(`/v1/properties/${id}`, data);
    return response.data;
  },

  deleteProperty: async (id: string) => {
    const response = await api.delete(`/v1/properties/${id}`);
    return response.data;
  },

  uploadImage: async (file: File, folder = "hosthaven") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await api.post(`/v1/uploads/single?folder=${folder}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  getHotel: async () => {
    const response = await api.get("/v1/vendor/properties");
    const properties = response.data?.data || response.data || [];
    return Array.isArray(properties) ? properties[0] || null : properties;
  },

  updateHotel: async (data: unknown) => {
    const propsResp = await api.get("/v1/vendor/properties");
    const properties = propsResp.data?.data || propsResp.data || [];
    const hotel = Array.isArray(properties) ? properties[0] : null;
    if (!hotel?.id) throw new Error("No hotel found");
    const response = await api.put(`/v1/properties/${hotel.id}`, data);
    return response.data;
  },

  uploadHotelImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/v1/uploads/single?folder=hosthaven", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteHotelImage: async (_imgId: string) => {
    return { success: true };
  },
};
