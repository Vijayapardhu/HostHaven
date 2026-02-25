import { describe, it, expect, vi, beforeEach } from "vitest";
import { inventoryService } from "./inventory";
import api from "./api";

vi.mock("./api");

describe("inventoryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRoomInventory", () => {
    it("should fetch room inventory for a date", async () => {
      const mockInventory = [{ propertyId: "1", rooms: [] }];
      vi.mocked(api.get).mockResolvedValue({ data: { inventory: mockInventory } });

      const result = await inventoryService.getRoomInventory("2026-02-25");

      expect(api.get).toHaveBeenCalledWith("/v1/vendor/inventory", {
        params: { date: "2026-02-25" },
      });
      expect(result).toEqual(mockInventory);
    });
  });

  describe("blockDate", () => {
    it("should block a date for a room", async () => {
      const blockData = { roomTypeId: "room-1", date: "2026-03-01", reason: "Maintenance" };
      const mockResponse = { data: { success: true } };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await inventoryService.blockDate(blockData);

      expect(api.post).toHaveBeenCalledWith("/v1/vendor/inventory/block-date", blockData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("unblockDate", () => {
    it("should unblock a previously blocked date", async () => {
      const unblockData = { roomTypeId: "room-1", date: "2026-03-01" };
      const mockResponse = { data: { success: true } };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await inventoryService.unblockDate(unblockData);

      expect(api.post).toHaveBeenCalledWith("/v1/vendor/inventory/unblock-date", unblockData);
      expect(result).toEqual(mockResponse.data);
    });
  });
});
