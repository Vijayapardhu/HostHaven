import api from "@/lib/api";
import imageCompression from "browser-image-compression";

const getData = (response: any) => response?.data?.data ?? response?.data ?? response;

const imageCompressionOptions = {
  maxSizeMB: 2,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
};

const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  try {
    const compressedFile = await imageCompression(file, imageCompressionOptions);
    console.log(
      `[Upload] Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(
        compressedFile.size /
        1024 /
        1024
      ).toFixed(2)}MB`
    );
    return compressedFile;
  } catch (error) {
    console.warn("[Upload] Compression failed, using original file:", error);
    return file;
  }
};

export const vendorService = {
  login: async (email: string, password: string) => {
    const response = await api.post("/v1/vendor/login", { email, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/v1/vendor/profile");
    return getData(response.data);
  },

  updateProfile: async (data: unknown) => {
    const response = await api.put("/v1/vendor/profile", data);
    return getData(response.data);
  },

  getDashboard: async () => {
    const response = await api.get("/v1/vendor/dashboard");
    return getData(response.data);
  },

  getProperties: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/vendor/properties", { params });
    return getData(response.data);
  },

  getPropertyById: async (id: string) => {
    const response = await api.get(`/v1/properties/${id}`);
    return getData(response.data);
  },

  createProperty: async (data: unknown) => {
    const response = await api.post("/v1/properties", data);
    return getData(response.data);
  },

  updateProperty: async (id: string, data: unknown) => {
    const response = await api.put(`/v1/properties/${id}`, data);
    return getData(response.data);
  },

  deleteProperty: async (id: string) => {
    const response = await api.delete(`/v1/properties/${id}`);
    return getData(response.data);
  },

  uploadImage: async (file: File, folder = "hosthaven") => {
    const compressedFile = await compressImage(file);
    const formData = new FormData();
    formData.append("file", compressedFile);
    formData.append("folder", folder);

    const response = await api.post(`/v1/uploads/single?folder=${folder}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return getData(response.data);
  },

  getHotel: async () => {
    const response = await api.get("/v1/vendor/properties");
    const properties = getData(response.data);
    return Array.isArray(properties) ? properties[0] || null : properties;
  },

  updateHotel: async (data: unknown) => {
    const propsResp = await api.get("/v1/vendor/properties");
    const properties = getData(propsResp.data);
    const hotel = Array.isArray(properties) ? properties[0] : null;
    if (!hotel?.id) throw new Error("No hotel found");
    const response = await api.put(`/v1/properties/${hotel.id}`, data);
    return getData(response.data);
  },

  uploadHotelImage: async (file: File) => {
    const compressedFile = await compressImage(file);
    const formData = new FormData();
    formData.append("file", compressedFile);
    const response = await api.post("/v1/uploads/single?folder=hosthaven", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return getData(response.data);
  },

  deleteHotelImage: async (_imgId: string) => {
    return { success: true };
  },

  getCities: async () => {
    const response = await api.get("/v1/properties/cities");
    const data = getData(response.data);
    if (Array.isArray(data)) {
      return data.map((c: { city: string }) => c.city.toUpperCase());
    }
    return [];
  },

  forgotPassword: async (email: string) => {
    const response = await api.post("/v1/vendor/forgot-password", { email });
    return getData(response.data);
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post("/v1/vendor/reset-password", { token, newPassword });
    return getData(response.data);
  },

  getRegistrationFee: async () => {
    const response = await api.get("/v1/vendor/registration-fee");
    return getData(response.data);
  },

  getApplicationStatus: async () => {
    const response = await api.get("/v1/vendor/application-status");
    return getData(response.data);
  },
};
