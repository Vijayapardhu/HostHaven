import { describe, it, expect, vi, beforeEach } from "vitest";
import { supportService } from "./support";
import api from "./api";

vi.mock("./api");

describe("supportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMyTickets", () => {
    it("should fetch support tickets", async () => {
      const mockTickets = [
        { id: "1", category: "BOOKING", status: "OPEN", message: "Help needed" },
      ];
      vi.mocked(api.get).mockResolvedValue({ data: mockTickets });

      const result = await supportService.getMyTickets();

      expect(api.get).toHaveBeenCalledWith("/v1/vendor/support/tickets", {
        params: undefined,
      });
      expect(result).toEqual(mockTickets);
    });

    it("should fetch tickets with status filter", async () => {
      const mockTickets = [];
      vi.mocked(api.get).mockResolvedValue({ data: mockTickets });

      await supportService.getMyTickets({ status: "RESOLVED" });

      expect(api.get).toHaveBeenCalledWith("/v1/vendor/support/tickets", {
        params: { status: "RESOLVED" },
      });
    });
  });

  describe("createTicket", () => {
    it("should create a new support ticket", async () => {
      const ticketData = {
        category: "PAYMENT",
        message: "Payment issue",
      };
      const mockResponse = { data: { id: "ticket-1", ...ticketData } };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await supportService.createTicket(ticketData);

      expect(api.post).toHaveBeenCalledWith("/v1/vendor/support/tickets", ticketData);
      expect(result).toEqual(mockResponse.data);
    });
  });
});
