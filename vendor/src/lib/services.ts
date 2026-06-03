import api from "@/lib/api";

export interface VendorService {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  priceUnit: string;
  images: Array<{ url: string }>;
  duration: string;
  isActive: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  advanceType: string;
  advanceValue: number;
}

export const servicesService = {
  getServices: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/services", { params });
    const payload = response.data?.data ?? response.data;
    const services = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.services)
        ? payload.services
        : [];
    return services.map(normalizeService);
  },

  getServiceById: async (id: string) => {
    const response = await api.get(`/v1/services/${id}`);
    return normalizeService(response.data?.data ?? response.data);
  },

  createService: async (data: Partial<VendorService>) => {
    const response = await api.post("/v1/services", toServicePayload(data));
    return normalizeService(response.data?.data ?? response.data);
  },

  updateService: async (id: string, data: Partial<VendorService>) => {
    const response = await api.put(`/v1/services/${id}`, toServicePayload(data));
    return normalizeService(response.data?.data ?? response.data);
  },

  deleteService: async (id: string) => {
    const response = await api.delete(`/v1/services/${id}`);
    return response.data?.data ?? response.data;
  },

  activateService: async (id: string) => {
    const response = await api.post(`/v1/services/${id}/activate`);
    return normalizeService(response.data?.data ?? response.data);
  },

  deactivateService: async (id: string) => {
    const response = await api.post(`/v1/services/${id}/deactivate`);
    return normalizeService(response.data?.data ?? response.data);
  },
};

function normalizeService(service: any): VendorService {
  const images = Array.isArray(service?.images)
    ? service.images.map((image: any) =>
        typeof image === "string" ? { url: image } : image
      )
    : [];

  const isActiveValue = service?.isActive ?? service?.active;
  const isServiceActive = isActiveValue === true || isActiveValue === "true" || isActiveValue === 1 || isActiveValue === "1";
  
  return {
    id: service?.id,
    name: service?.name,
    description: service?.description,
    category: service?.category,
    price: Number(service?.price ?? service?.basePrice ?? 0),
    priceUnit: service?.priceUnit ?? "per_person",
    images,
    duration: service?.duration ?? "",
    isActive: isServiceActive,
    isVerified: Boolean(service?.isVerified),
    rating: Number(service?.rating ?? 0),
    reviewCount: Number(service?.reviewCount ?? 0),
    advanceType: service?.advanceType ?? "percentage",
    advanceValue: Number(service?.advanceValue ?? 0),
  };
}

function toServicePayload(data: Partial<VendorService>) {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.category !== undefined) payload.category = data.category;
  if (data.price !== undefined) payload.basePrice = data.price;
  if (data.priceUnit !== undefined) payload.priceUnit = data.priceUnit;
  if (data.duration !== undefined) payload.duration = data.duration;
  if (data.advanceType !== undefined) payload.advanceType = data.advanceType;
  if (data.advanceValue !== undefined) payload.advanceValue = data.advanceValue;
  if (data.isActive !== undefined) payload.active = data.isActive;
  if (data.images !== undefined) {
    payload.images = data.images.map((image) => image.url).filter(Boolean);
  }
  return payload;
}
