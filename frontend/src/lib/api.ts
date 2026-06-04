import imageCompression from "browser-image-compression";

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

// Auto-detect API URL with intelligent fallback
const getApiBaseUrl = (): string => {
  // Use explicit env var first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Auto-detect based on current domain
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    // If we're on www.hosthaven.in or hosthaven.in, API is at api.hosthaven.in
    if (hostname.includes("hosthaven.in")) {
      const apiHostname = hostname.replace(/^(www\.)?/, "api.");
      return `${protocol}//${apiHostname}`;
    }
    // If we're on localhost, API is also localhost with port 4000
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:4000";
    }
  }
  
  // Fallback for server-side or unknown domains
  return "https://api.hosthaven.in";
};

const BASE_URL = getApiBaseUrl().replace(/\/$/, '');
const API_URL = `${BASE_URL}/v1`;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

class ApiService {
  private baseUrl: string;
  push!: {
    getVapidKey: () => Promise<{ publicKey: string }>;
    subscribe: (subscription: any) => Promise<{ message: string }>;
    unsubscribe: (endpoint: string) => Promise<{ message: string }>;
  };

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token =
        localStorage.getItem("vendorToken") ||
        localStorage.getItem("accessToken");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await response.json();
      if (data.success && data.data?.accessToken) {
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken || refreshToken);
        return data.data.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async handleResponse<T>(response: Response, endpoint?: string, originalBody?: any): Promise<T> {
    if (response.status === 401 && endpoint !== "/auth/refresh" && endpoint !== "/auth/login") {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        const newToken = await this.refreshAccessToken();
        this.isRefreshing = false;

        if (newToken) {
          this.onRefreshed(newToken);
          const retryHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newToken}`,
          };
          const retryInit: RequestInit & { headers: Record<string, string> } = {
            method: response.method || "GET",
            headers: retryHeaders,
          };
          if (originalBody) {
            retryInit.body = JSON.stringify(originalBody);
          }
          const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, retryInit);
          const retryData: ApiResponse<T> = await retryResponse.json();
          if (retryData.success) {
            return retryData.data as T;
          }
        }

        // Refresh failed, clear tokens
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("vendorToken");
        window.location.href = "/login";
        throw new Error("Session expired");
      } else {
        // Another refresh is in progress, queue this request
        return new Promise((resolve, reject) => {
          this.addRefreshSubscriber(async (token: string) => {
            try {
              const retryHeaders: Record<string, string> = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              };
              const retryInit: RequestInit & { headers: Record<string, string> } = {
                method: response.method || "GET",
                headers: retryHeaders,
              };
              if (originalBody) {
                retryInit.body = JSON.stringify(originalBody);
              }
              const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, retryInit);
              const retryData: ApiResponse<T> = await retryResponse.json();
              if (retryData.success) {
                resolve(retryData.data as T);
              } else {
                reject(new Error("Session expired"));
              }
            } catch {
              reject(new Error("Session expired"));
            }
          });
        });
      }
    }

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      const error = data.error || {
        code: "UNKNOWN_ERROR",
        message: "An unexpected error occurred",
      };
      throw new Error(error.message);
    }

    return data.data as T;
  }

  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "GET",
      headers: this.getHeaders(includeAuth),
    });

    return this.handleResponse<T>(response, endpoint);
  }

  async post<T>(
    endpoint: string,
    body?: any,
    includeAuth: boolean = false,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: this.getHeaders(includeAuth),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response, endpoint, body);
  }

  async put<T>(
    endpoint: string,
    body?: any,
    includeAuth: boolean = true,
  ): Promise<T> {
    const headers = this.getHeaders(includeAuth);
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: body ? headers : Object.fromEntries(
        Object.entries(headers).filter(([key]) => key !== 'Content-Type')
      ),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response, endpoint, body);
  }

  private async getPage<T>(
    endpoint: string,
    includeAuth: boolean = true,
  ): Promise<{ data: T; meta: any }> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "GET",
      headers: this.getHeaders(includeAuth),
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      const error = json.error || {
        code: "UNKNOWN_ERROR",
        message: "An unexpected error occurred",
      };
      throw new Error(error.message);
    }
    return { data: json.data as T, meta: json.meta };
  }

  async delete<T>(
    endpoint: string,
    includeAuth: boolean = true,
    body?: unknown,
  ): Promise<T> {
    const options: RequestInit = {
      method: "DELETE",
      headers: this.getHeaders(includeAuth),
    };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(`${this.baseUrl}${endpoint}`, options);

    return this.handleResponse<T>(response, endpoint, body);
  }

  // Auth endpoints
  auth = {
    register: (data: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }) => this.post<{ user: any; message: string }>("/auth/register", data),

    login: (data: { email: string; password: string }) =>
      this.post<{
        user: any;
        tokens: {
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        };
      }>("/auth/login", data),

    loginWithGoogle: (idToken: string) =>
      this.post<{
        user: any;
        tokens: {
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        };
        isNewUser: boolean;
      }>("/auth/google", { idToken }),

    getGoogleAuthUrl: () =>
      this.get<{ url: string; state: string }>("/auth/google", false),

    refreshTokens: (refreshToken: string) =>
      this.post<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }>("/auth/refresh", { refreshToken }),

    logout: (refreshToken?: string) =>
      this.post<{ message: string }>("/auth/logout", { refreshToken }, true),

    logoutAll: () =>
      this.post<{ message: string }>("/auth/logout-all", {}, true),

    getMe: () => this.get<{ user: any }>("/auth/me"),

    verifyEmail: (token: string) =>
      this.post<{ message: string }>("/auth/verify-email", { token }),

    resendVerification: (email: string) =>
      this.post<{ message: string }>("/auth/resend-verification", { email }),

    forgotPassword: (email: string) =>
      this.post<{ message: string }>("/auth/forgot-password", { email }),

    resetPassword: (token: string, password: string, confirmPassword: string) =>
      this.post<{ message: string }>("/auth/reset-password", {
        token,
        password,
        confirmPassword,
      }),

    linkGoogle: (idToken: string) =>
      this.post<{ message: string }>("/auth/link-google", { idToken }, true),

    unlinkGoogle: () => this.delete<{ message: string }>("/auth/unlink-google"),

    updateProfile: (data: { name?: string; avatar?: string; phone?: string }) =>
      this.put<{ user: any }>("/auth/profile", data),

    uploadAvatar: async (file: File) => {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("folder", "hosthaven/avatars");

      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Not authenticated");
      const response = await fetch(
        `${this.baseUrl}/uploads/single?folder=hosthaven/avatars`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || "Upload failed");
      }
      return data.data.url;
    },

    getNotifications: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return this.getPage<any[]>(`/notifications${query}`);
    },

    markNotificationRead: (id: string) =>
      this.put<any>(`/notifications/${id}/read`),

    markAllNotificationsRead: () => this.put<any>(`/notifications/read-all`),

    getAddresses: async () => {
      const result = await this.get<any>("/auth/addresses");
      if (Array.isArray(result)) {
        return result;
      }
      if (result && Array.isArray(result.data)) {
        return result.data;
      }
      if (result && Array.isArray(result.addresses)) {
        return result.addresses;
      }
      return [];
    },

    addAddress: (data: {
      label: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
    }) => this.post<any>("/auth/addresses", data),

    updateAddress: (
      id: string,
      data: {
        label?: string;
        address?: string;
        city?: string;
        state?: string;
        pincode?: string;
      },
    ) => this.put<any>(`/auth/addresses/${id}`, data),

    deleteAddress: (id: string) => this.delete<any>(`/auth/addresses/${id}`),

    changePassword: (currentPassword: string, newPassword: string) =>
      this.post<{ message: string }>("/auth/change-password", {
        currentPassword,
        newPassword,
      }),
  };

  // Properties endpoints
  properties = {
    getAll: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return this.getPage<any[]>(`/properties${query}`);
    },

    getById: (id: string) => this.get<any>(`/properties/${id}`),

    getFeatured: () => this.get<any[]>(`/properties/featured`, false),

    getCities: () =>
      this.get<Array<{ city: string; state: string; count: number }>>(
        `/properties/cities`,
        false,
      ),

    search: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return this.getPage<any[]>(`/properties/search${query}`, false);
    },
  };

  // Inventory endpoints
  inventory = {
    lock: (data: {
      roomId: string;
      checkIn: string;
      checkOut: string;
      quantity?: number;
    }) => this.post<any>("/inventory/lock", data, true),

    release: (data: { roomId: string }) =>
      this.post<any>("/inventory/release", data, true),

    getAvailability: (params: { roomId: string; date: string }) => {
      const query = new URLSearchParams(params).toString();
      return this.get<any>(`/inventory?${query}`, true);
    },
  };

  // Service booking endpoints
  serviceBookings = {
    create: (data: {
      serviceId?: string;
      serviceName: string;
      serviceCategory?: string;
      serviceDate: string;
      serviceTime: string;
      location: string;
      notes?: string;
      advanceAmount: number;
      totalAmount?: number;
      razorpayPaymentId?: string;
      razorpayOrderId?: string;
    }) => this.post<any>("/services/bookings", data, true),

    getMy: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return this.get<any>(`/services/bookings/my${query}`, true);
    },

    getMyBooking: (id: string) => {
      return this.get<any>(`/services/bookings/my/${id}`, true);
    },

    getInvoice: (id: string) => {
      return this.get<any>(`/services/bookings/my/${id}/invoice`, true);
    },

    cancelMyBooking: (id: string) => {
      return this.put<any>(`/services/bookings/my/${id}/cancel`, undefined, true);
    },
  };

  payments = {
    createOrder: (bookingId: string) =>
      this.post<{
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
      }>("/payments/create-order", { bookingId }, true),

    createServiceOrder: (serviceBookingId: string) =>
      this.post<{
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
      }>("/payments/create-service-order", { serviceBookingId }, true),

    verify: (data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => this.post<any>("/payments/verify", data, true),

    verifyService: (data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      serviceBookingId: string;
    }) => this.post<any>("/payments/verify-service", data, true),
  };

  bookings = {
    create: (data: {
      propertyId: string;
      roomId?: string;
      checkInDate: string;
      checkOutDate: string;
      adults: number;
      children?: number;
      extraBeds?: number;
      specialRequests?: string;
      guestDetails?: Array<{
        name: string;
        age: number;
        gender: "male" | "female" | "other";
        idProof?: string;
      }>;
    }) => this.post<any>("/bookings", data, true),

    cancel: (bookingId: string, reason?: string) =>
      this.put<any>(`/bookings/${bookingId}/cancel`, { reason }, true),

    getMy: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return this.getPage<any[]>(`/bookings${query}`);
    },

    getById: (bookingId: string) =>
      this.get<any>(`/bookings/${bookingId}`, true),

    checkPrice: (data: {
      propertyId: string;
      roomId?: string;
      checkIn: string;
      checkOut: string;
      guests: number;
      extraBeds?: number;
    }) => this.post<{
      baseAmount: number;
      extraBedAmount: number;
      taxAmount: number;
      totalAmount: number;
      nights: number;
      breakdown: {
        roomPrice: number;
        nights: number;
        extraBeds: number;
        extraBedPricePerNight: number;
        taxRate: string;
      };
    }>("/bookings/check-price", data, true),

    downloadInvoice: async (bookingId: string): Promise<Blob> => {
      const headers = this.getHeaders(true);
      const response = await fetch(
        `${this.baseUrl}/bookings/${bookingId}/invoice/pdf`,
        {
          headers,
        },
      );
      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }
      return response.blob();
    },
  };

  // Support ticket endpoints
  support = {
    create: (data: {
      category: string;
      bookingReference?: string;
      message: string;
      attachmentUrl?: string;
    }) => this.post<any>("/support/tickets", data, true),

    getMy: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return this.getPage<any[]>(`/support/tickets/my${query}`, true);
    },

    getMyById: (id: string) => this.get<any>(`/support/tickets/my/${id}`, true),
  };

  // Temples endpoints
  temples = {
    getAll: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return this.getPage<any[]>(`/temples${query}`, false);
    },

    getById: (idOrSlug: string) => this.get<any>(`/temples/${idOrSlug}`, false),
  };

  // Services endpoints (public listing)
  services = {
    getAll: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return this.getPage<any[]>(`/services${query}`, false);
    },

    getById: (id: string) => this.get<any>(`/services/${id}`, false),

    getCities: () => this.get<string[]>(`/services/cities`, false),
  };

  // Reviews endpoints (public)
  reviews = {
    getByProperty: (propertyId: string, params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return this.get<any>(`/reviews/property/${propertyId}${query}`, false);
    },
    checkEligibility: (propertyId: string) => {
      return this.get<any>(`/reviews/eligibility/${propertyId}`, true);
    },
    create: (data: {
      propertyId: string;
      bookingId?: string;
      rating: number;
      title?: string;
      comment: string;
      cleanliness?: number;
      service?: number;
      location?: number;
      value?: number;
      images?: string[];
      videos?: string[];
    }) => {
      return this.post<any>("/reviews", data, true);
    },
    getMy: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return this.get<any>(`/reviews${query}`, true);
    },
    update: (id: string, data: {
      rating?: number;
      title?: string;
      comment?: string;
      cleanliness?: number;
      service?: number;
      location?: number;
      value?: number;
      images?: string[];
    }) => {
      return this.put<any>(`/reviews/${id}`, data, true);
    },
    delete: (id: string) => {
      return this.delete<any>(`/reviews/${id}`, true);
    },
  };

  // Contact form
  contact = {
    submit: (data: {
      name: string;
      email: string;
      phone: string;
      subject: string;
      message: string;
    }) =>
      this.post<any>(
        "/support/tickets",
        {
          category: data.subject,
          message: `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\n\n${data.message}`,
        },
        true,
      ),
  };

  // SEO settings endpoints (public, no auth required)
  seo = {
    getSettings: () =>
      this.get<{
        platformName: string;
        seo: {
          metaTitle: string;
          metaDescription: string;
          indexable: boolean;
          canonicalBaseUrl: string;
        };
        social: Record<string, string>;
      }>("/seo/settings", false),
  };

  // Wishlist endpoints
  wishlist = {
    getAll: () => this.getPage<any[]>("/wishlist"),

    add: (data: {
      itemType: string;
      itemId: string;
      itemName: string;
      itemImage: string;
      itemLocation: string;
      itemPrice?: number;
      itemRating?: number;
    }) => this.post<{ item: any; id?: string }>("/wishlist", data, true),

    remove: (id: string) =>
      this.delete<{ success: boolean }>(`/wishlist/${id}`),
  };

}

export const api = new ApiService(API_URL);

api.push = {
  getVapidKey: () => api.get<{ publicKey: string }>("/push/vapid-key", false),

  subscribe: (subscription: any) =>
    api.post<{ message: string }>("/push/subscribe", subscription, true),

  unsubscribe: (endpoint: string) =>
    api.delete<{ message: string }>("/push/unsubscribe", true, { endpoint }),
};

export default api;
