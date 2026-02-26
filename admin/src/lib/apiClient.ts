import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { ApiError, ApiResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

class ApiClient {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Check for access_token first, then admin_token (for backward compatibility)
        const token = localStorage.getItem("access_token") || localStorage.getItem("admin_token");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearAuth();
            // Don't auto-redirect - let ProtectedRoute handle auth
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.transformError(error));
      },
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

    this.refreshTokenPromise = (async () => {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await axios.post(`${API_BASE_URL}/v1/auth/refresh`, {
        refreshToken,
      });

      const { accessToken } = response.data;
      localStorage.setItem("access_token", accessToken);
      this.refreshTokenPromise = null;
      return accessToken;
    })();

    return this.refreshTokenPromise;
  }

  private clearAuth() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("refresh_token");
    this.refreshTokenPromise = null;
  }

  async get<T>(
    url: string,
    params?: Record<string, unknown>,
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
    onProgress?: (progress: number) => void,
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(progress);
        }
      },
    });
    return response.data;
  }

  setAuthToken(token: string) {
    localStorage.setItem("access_token", token);
  }

  setRefreshToken(token: string) {
    localStorage.setItem("refresh_token", token);
  }

  clearTokens() {
    this.clearAuth();
  }
}

export const apiClient = new ApiClient();
export default apiClient;
