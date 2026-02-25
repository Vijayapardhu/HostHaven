import axios from "axios";
import { getVendorToken, removeVendorToken } from "@/services/tokenService";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getVendorToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      removeVendorToken();
      window.dispatchEvent(new CustomEvent("vendor:unauthorized"));
    }

    return Promise.reject(error);
  }
);

export default api;
