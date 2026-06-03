import { describe, it, expect, vi, beforeEach } from "vitest";
import { notificationsService } from "./notifications";
import api from "./api";

vi.mock("./api");

describe("notificationsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("should fetch all notifications", async () => {
      const mockNotifications = [
        { id: "1", title: "New Booking", isRead: false },
        { id: "2", title: "Payment Received", isRead: true },
      ];
      vi.mocked(api.get).mockResolvedValue({ data: mockNotifications });

      const result = await notificationsService.getNotifications();

      expect(api.get).toHaveBeenCalledWith("/v1/vendor/notifications", {
        params: undefined,
      });
      expect(result).toEqual(mockNotifications);
    });

    it("should fetch unread notifications only", async () => {
      const mockNotifications = [{ id: "1", isRead: false }];
      vi.mocked(api.get).mockResolvedValue({ data: mockNotifications });

      await notificationsService.getNotifications({ isRead: "false" });

      expect(api.get).toHaveBeenCalledWith("/v1/vendor/notifications", {
        params: { isRead: "false" },
      });
    });
  });

  describe("markRead", () => {
    it("should mark a notification as read", async () => {
      const mockResponse = { data: { id: "1", isRead: true } };
      vi.mocked(api.put).mockResolvedValue(mockResponse);

      const result = await notificationsService.markRead("notif-1");

      expect(api.put).toHaveBeenCalledWith("/v1/vendor/notifications/notif-1/read");
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("markAllRead", () => {
    it("should mark all notifications as read", async () => {
      const mockResponse = { data: { success: true } };
      vi.mocked(api.put).mockResolvedValue(mockResponse);

      const result = await notificationsService.markAllRead();

      expect(api.put).toHaveBeenCalledWith("/v1/vendor/notifications/read-all");
      expect(result).toEqual(mockResponse.data);
    });
  });
});
