import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "./auth";
import api from "./api";

vi.mock("./api");

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loginVendor", () => {
    it("should login vendor successfully", async () => {
      const mockResponse = {
        data: { token: "test-token", vendor: { id: "1", name: "Test Vendor" } },
      };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authService.loginVendor({ email: "test@example.com", password: "password123" });

      expect(api.post).toHaveBeenCalledWith("/v1/vendor/login", {
        email: "test@example.com",
        password: "password123",
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should throw error on failed login", async () => {
      vi.mocked(api.post).mockRejectedValue(new Error("Invalid credentials"));

      await expect(
        authService.loginVendor({ email: "wrong@example.com", password: "wrongpass" })
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("forgotPassword", () => {
    it("should send password reset email", async () => {
      const mockResponse = { data: { message: "Reset email sent" } };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authService.forgotPassword("test@example.com");

      expect(api.post).toHaveBeenCalledWith("/v1/vendor/forgot-password", {
        email: "test@example.com",
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
