import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { VendorProvider } from "./VendorContext";

// Mock dependencies
vi.mock("@/services/tokenService", () => ({
  getVendorToken: vi.fn(),
  removeVendorToken: vi.fn(),
  hasValidAccessToken: vi.fn(() => false),
  getAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
  clearTokens: vi.fn(),
  checkAndClearExpiredToken: vi.fn(() => false),
  setTokens: vi.fn(),
  getRefreshToken: vi.fn(),
}));

vi.mock("@/lib/vendor", () => ({
  vendorService: {
    getProfile: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  authService: {
    loginVendor: vi.fn(),
  },
}));

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should provide auth context to children", () => {
    const TestComponent = () => {
      return <div>Test Content</div>;
    };

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should handle vendor:unauthorized event", async () => {
    const { getVendorToken, removeVendorToken } = await import("@/services/tokenService");
    vi.mocked(getVendorToken).mockReturnValue("test-token");

    const TestComponent = () => <div>Mounted</div>;

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    // Simulate unauthorized event
    window.dispatchEvent(new CustomEvent("vendor:unauthorized"));

    await waitFor(() => {
      expect(removeVendorToken).toHaveBeenCalled();
    });
  });
});

describe("VendorContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should provide vendor context to children", () => {
    const TestComponent = () => {
      return <div>Vendor Content</div>;
    };

    render(
      <BrowserRouter>
        <VendorProvider>
          <TestComponent />
        </VendorProvider>
      </BrowserRouter>
    );

    expect(screen.getByText("Vendor Content")).toBeInTheDocument();
  });
});
