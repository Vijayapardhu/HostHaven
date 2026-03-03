import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface VendorUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface VendorProfile {
  id: string;
  businessName: string;
  businessAddress?: string;
  gstNumber?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  bankAccount?: any;
  isApproved: boolean;
  approvedAt?: string;
  commissionRate: number;
  user: VendorUser;
}

interface VendorContextType {
  vendor: VendorProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshVendor: () => Promise<void>;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const VendorProvider = ({ children }: { children: ReactNode }) => {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const storeTokens = (tokens: { accessToken: string; refreshToken: string }) => {
    localStorage.setItem("vendorToken", tokens.accessToken);
    localStorage.setItem("vendorRefreshToken", tokens.refreshToken);
  };

  const clearTokens = () => {
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorRefreshToken");
  };

  const refreshVendor = useCallback(async () => {
    const token = localStorage.getItem("vendorToken");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.vendor.getProfile();
      setVendor(response);
    } catch {
      clearTokens();
      setVendor(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshVendor();
  }, [refreshVendor]);

  const login = async (email: string, password: string) => {
    const response = await api.vendor.login(email, password);
    storeTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken });
    setVendor(response.vendor);
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("vendorRefreshToken");
      await api.auth.logout(refreshToken || undefined);
    } catch {
      // Ignore
    }
    clearTokens();
    setVendor(null);
  };

  return (
    <VendorContext.Provider
      value={{
        vendor,
        isAuthenticated: !!vendor,
        isLoading,
        login,
        logout,
        refreshVendor,
      }}
    >
      {children}
    </VendorContext.Provider>
  );
};

export const useVendor = () => {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error("useVendor must be used within a VendorProvider");
  }
  return context;
};
