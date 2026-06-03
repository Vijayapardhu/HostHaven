import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { authService } from "@/lib/auth";
import { vendorService } from "@/lib/vendor";
import {
  clearTokens,
  hasValidAccessToken,
  setTokens,
  checkAndClearExpiredToken,
} from "@/services/tokenService";

interface VendorUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
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
  logout: () => Promise<void>;
  refreshVendor: () => Promise<void>;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const VendorProvider = ({ children }: { children: ReactNode }) => {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshVendor = useCallback(async () => {
    if (!hasValidAccessToken()) {
      clearTokens();
      setVendor(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await vendorService.getProfile();
      setVendor(response);
    } catch {
      clearTokens();
      setVendor(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAndClearExpiredToken();
    refreshVendor();
  }, [refreshVendor]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearTokens();
      setVendor(null);
      window.location.href = "/login";
    };

    window.addEventListener("vendor:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("vendor:unauthorized", handleUnauthorized);
    };
  }, []);

const login = async (email: string, password: string) => {
    const response = await vendorService.login(email, password);
    let accessToken: string | undefined;
    let refreshToken: string | undefined;
    let vendorData: Record<string, unknown> | undefined;
    
    const responseData = response.data ?? response;
    
    if (responseData?.accessToken) {
      accessToken = responseData.accessToken;
      refreshToken = responseData.refreshToken;
      vendorData = responseData.vendor;
    } else if (responseData?.vendor) {
      vendorData = { ...(responseData.vendor as Record<string, unknown>), user: responseData.user };
    }
    
    if (!accessToken && !vendorData) {
      console.error('Login response:', response);
      throw new Error('Invalid login response');
    }
    
    if (accessToken) {
      setTokens({ accessToken, refreshToken });
    }
    setVendor(vendorData as any);
  };

  const logout = async () => {
    try {
      await authService.logout();
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
