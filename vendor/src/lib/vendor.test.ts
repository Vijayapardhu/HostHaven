import { describe, it, expect, vi, beforeEach } from "vitest";
import { vendorService } from "./vendor";
import api from "./api";

vi.mock("./api");

describe("vendorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProfile", () => {
    it("should fetch vendor profile", async () => {
      const mockProfile = {
        id: "vendor-1",
        name: "Test Hotel",
        email: "test@hotel.com",
      };
      vi.mocked(api.get).mockResolvedValue({ data: mockProfile });

      const result = await vendorService.getProfile();

      expect(api.get).toHaveBeenCalledWith("/v1/vendor/profile");
      expect(result).toEqual(mockProfile);
    });
  });

  describe("updateProfile", () => {
    it("should update vendor profile", async () => {
      const updateData = { name: "Updated Hotel Name" };
      const mockResponse = { data: { id: "vendor-1", ...updateData } };
      vi.mocked(api.patch).mockResolvedValue(mockResponse);

      const result = await vendorService.updateProfile(updateData);

      expect(api.patch).toHaveBeenCalledWith("/v1/vendor/profile", updateData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getProperties", () => {
    it("should fetch vendor properties", async () => {
      const mockProperties = [
        { id: "prop-1", name: "Hotel A" },
        { id: "prop-2", name: "Hotel B" },
      ];
      vi.mocked(api.get).mockResolvedValue({ data: mockProperties });

      const result = await vendorService.getProperties();

      expect(api.get).toHaveBeenCalledWith("/v1/vendor/properties", { params: undefined });
      expect(result).toEqual(mockProperties);
    });
  });
});
