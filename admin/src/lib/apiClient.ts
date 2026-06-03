import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { ApiError, ApiResponse } from "../types";
import { handleError } from "./errorHandler";

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    
    if (hostname === "admin.hosthaven.in" || hostname.startsWith("admin.")) {
      return "https://api.hosthaven.in";
    }
    
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:4000";
    }
    
    if (hostname.startsWith("admin.")) {
      const apiHostname = hostname.replace("admin.", "api.");
      return `https://${apiHostname}`;
    }
  }
  
  return "https://api.hosthaven.in";
};

const API_BASE_URL = getApiBaseUrl();

const TOKEN_KEY = "admin_access_token";
const REFRESH_TOKEN_KEY = "admin_refresh_token";
const TOKEN_EXPIRY_KEY = "admin_token_expiry";

const dispatchLogout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  window.dispatchEvent(new CustomEvent('auth:logout'));
};

const dispatchTokenRefresh = (newToken: string) => {
  window.dispatchEvent(new CustomEvent('auth:tokenRefresh', { detail: { token: newToken } }));
};

class ApiClient {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;
  private isRefreshing = false;
  private failedRequestsQueue: Array<{
    resolve: (value: string) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
      withCredentials: true,
    });

    this.setupInterceptors();
    this.setupVisibilityHandler();
  }

  private setupVisibilityHandler() {
    if (typeof window !== "undefined") {
      window.addEventListener("visibilitychange", async () => {
        if (document.visibilityState === "visible") {
          await this.handleVisibilityChange();
        }
      });
    }
  }

  private async handleVisibilityChange() {
    const token = this.getToken();
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (token && expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      const now = Date.now();
      const bufferTime = 5 * 60 * 1000;
      
      if (expiry - now < bufferTime) {
        try {
          await this.refreshAccessToken();
        } catch {
          // Token refresh failed, user will be logged out on next request
        }
      }
    }
  }

  private getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getTokenExpiry(): number | null {
    try {
      const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      return expiry ? parseInt(expiry, 10) : null;
    } catch {
      return null;
    }
  }

  setTokenExpiry(expiresInSeconds: number) {
    try {
      const expiry = Date.now() + (expiresInSeconds * 1000);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
    } catch (error) {
      handleError(error, 'auth');
    }
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        const authHeader = response.headers['authorization'] || response.headers['Authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const newToken = authHeader.substring(7);
          this.setAuthToken(newToken);
        }
        
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
          _retryCount?: number;
        };

        if (error.response?.status === 429) {
          console.error('Rate limited (429). Too many requests sent.');
          return Promise.reject(this.transformError(error));
        }

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
            this.clearAuth();
            dispatchLogout();
            return Promise.reject(this.transformError(error));
          }

          const refreshToken = this.getRefreshToken();
          if (!refreshToken) {
            this.clearAuth();
            dispatchLogout();
            return Promise.reject(this.transformError(error));
          }

          try {
            const newToken = await this.refreshAccessToken();
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearAuth();
            dispatchLogout();
            return Promise.reject(this.transformError(refreshError as AxiosError));
          }
        }

        return Promise.reject(this.transformError(error));
      }
    );
  }

  private transformError(error: AxiosError): ApiError {
    const status = error.response?.status || 500;
    const data = (error.response?.data as Record<string, unknown>) || {};

    return {
      message:
        (data.message as string) ||
        error.message ||
        "An unexpected error occurred",
      code: (data.code as string) || "UNKNOWN_ERROR",
      status,
      details: data.details as Record<string, unknown> | undefined,
    };
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.isRefreshing = true;

    this.refreshTokenPromise = (async () => {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        this.isRefreshing = false;
        throw new Error("No refresh token available");
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/v1/auth/refresh`, {
          refreshToken,
        }, {
          withCredentials: true,
        });

        const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;
        
        this.setAuthToken(accessToken);
        
        if (newRefreshToken) {
          this.setRefreshToken(newRefreshToken);
        }
        
        if (expiresIn) {
          this.setTokenExpiry(expiresIn);
        }
        
        dispatchTokenRefresh(accessToken);
        
        this.isRefreshing = false;
        this.processQueue(null, accessToken);
        
        this.refreshTokenPromise = null;
        return accessToken;
      } catch (error) {
        this.isRefreshing = false;
        this.processQueue(error as Error, null);
        this.refreshTokenPromise = null;
        throw error;
      }
    })();

    return this.refreshTokenPromise;
  }

  private processQueue(error: Error | null, token: string | null) {
    this.failedRequestsQueue.forEach(promise => {
      if (error) {
        promise.reject(error);
      } else if (token) {
        promise.resolve(token);
      }
    });
    this.failedRequestsQueue = [];
  }

  private clearAuth() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
    } catch (error) {
      handleError(error, 'auth');
    }
    this.refreshTokenPromise = null;
    this.isRefreshing = false;
  }

  async get<T>(
    url: string,
    params?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data;
  }

  async upload<T>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
    return response.data;
  }

  setAuthToken(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      handleError(error, 'auth');
    }
  }

  setRefreshToken(token: string) {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      handleError(error, 'auth');
    }
  }

  clearTokens() {
    this.clearAuth();
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
