import axios from "axios";
import { getVendorToken, removeVendorToken, getRefreshToken } from "@/services/tokenService";
import { authService } from "@/lib/auth";

// Auto-detect API URL with intelligent fallback
const getApiBaseUrl = (): string => {
  // Use explicit env var first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Auto-detect based on current domain
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    // If we're on vendor.hosthaven.in, API is at api.hosthaven.in
    if (hostname.startsWith("vendor.")) {
      const apiHostname = hostname.replace("vendor.", "api.");
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

const API_BASE_URL = getApiBaseUrl().replace(/\/$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = getVendorToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error?.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        await authService.refreshToken();
        const newToken = getVendorToken();
        
        processQueue(null, newToken || undefined);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        removeVendorToken();
        window.dispatchEvent(new CustomEvent("vendor:unauthorized"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error?.response?.status === 401) {
      removeVendorToken();
      window.dispatchEvent(new CustomEvent("vendor:unauthorized"));
    }

    return Promise.reject(error);
  }
);

export const push = {
  subscribe: async (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) => {
    return api.post('/v1/vendor/push/subscribe', subscription);
  },
  unsubscribe: async (endpoint: string) => {
    return api.delete('/v1/vendor/push/unsubscribe', { data: { endpoint } });
  },
};

export default api;
