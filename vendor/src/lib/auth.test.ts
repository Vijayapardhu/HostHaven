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

      expect(api.post).toHaveBeenCalledWith("/v1/auth/forgot-password", {
        email: "test@example.com",
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
  describe("changePassword", () => {
    it("should change password successfully with envelope response", async () => {
      const mockResponse = {
        data: { data: { message: "Password changed successfully" } },
      };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authService.changePassword("oldPass123", "newPass456");

      expect(api.post).toHaveBeenCalledWith("/v1/auth/change-password", {
        currentPassword: "oldPass123",
        newPassword: "newPass456",
      });
      expect(result).toEqual({ message: "Password changed successfully" });
    });

    it("should unwrap flat response when no envelope present", async () => {
      const mockResponse = {
        data: { message: "Password changed successfully" },
      };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authService.changePassword("oldPass123", "newPass456");

      expect(result).toEqual({ message: "Password changed successfully" });
    });

    it("should throw on incorrect current password (401)", async () => {
      vi.mocked(api.post).mockRejectedValue(
        Object.assign(new Error("Current password is incorrect"), { response: { status: 401 } })
      );

      await expect(
        authService.changePassword("wrongCurrent", "newPass456")
      ).rejects.toThrow("Current password is incorrect");
    });

    it("should throw when both fields are missing", async () => {
      vi.mocked(api.post).mockRejectedValue(
        Object.assign(new Error("Current and new password are required"), { response: { status: 400 } })
      );

      await expect(authService.changePassword("", "")).rejects.toThrow(
        "Current and new password are required"
      );
    });
  });});
