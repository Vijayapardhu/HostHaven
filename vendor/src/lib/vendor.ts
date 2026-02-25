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
    const response = await api.patch("/v1/vendor/profile", data);
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
    const response = await api.get(`/v1/vendor/properties/${id}`);
    return response.data;
  },

  createProperty: async (data: unknown) => {
    const response = await api.post("/v1/vendor/properties", data);
    return response.data;
  },

  updateProperty: async (id: string, data: unknown) => {
    const response = await api.patch(`/v1/vendor/properties/${id}`, data);
    return response.data;
  },

  deleteProperty: async (id: string) => {
    const response = await api.delete(`/v1/vendor/properties/${id}`);
    return response.data;
  },

  uploadImage: async (file: File, folder = "hosthaven") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await api.post(`/v1/vendor/uploads/single?folder=${folder}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },
};
