import { describe, it, expect, vi, beforeEach } from "vitest";
import { roomsService } from "./rooms";
import api from "./api";

vi.mock("./api");

describe("roomsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRooms", () => {
    it("should fetch rooms with query params", async () => {
      const mockRooms = [{ id: "1", name: "Deluxe Room" }];
      // Simulate canonical envelope: response.data = { data: [...] }
      vi.mocked(api.get).mockResolvedValue({ data: { data: mockRooms } });

      const result = await roomsService.getRooms("prop-1");

      expect(api.get).toHaveBeenCalledWith("/v1/rooms/property/prop-1");
      expect(result).toEqual(mockRooms);
    });
  });

  describe("createRoom", () => {
    it("should create a new room", async () => {
      const roomData = { name: "Suite", type: "SUITE", price: 5000 };
      const mockResponse = { data: { id: "room-1", ...roomData } };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await roomsService.createRoom(roomData);

      expect(api.post).toHaveBeenCalledWith("/v1/rooms", roomData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("updateRoom", () => {
    it("should update existing room", async () => {
      const updateData = { name: "Updated Suite" };
      const mockResponse = { data: { id: "room-1", ...updateData } };
      vi.mocked(api.put).mockResolvedValue(mockResponse);

      const result = await roomsService.updateRoom("room-1", updateData);

      expect(api.put).toHaveBeenCalledWith("/v1/rooms/room-1", updateData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("deleteRoom", () => {
    it("should delete a room", async () => {
      const mockResponse = { data: { message: "Room deleted" } };
      vi.mocked(api.delete).mockResolvedValue(mockResponse);

      const result = await roomsService.deleteRoom("room-1");

      expect(api.delete).toHaveBeenCalledWith("/v1/rooms/room-1");
      expect(result).toEqual(mockResponse.data);
    });
  });
});
