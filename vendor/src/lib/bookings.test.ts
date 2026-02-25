import { describe, it, expect, vi, beforeEach } from "vitest";
import { bookingsService } from "./bookings";
import api from "./api";

vi.mock("./api");

describe("bookingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBookings", () => {
    it("should fetch bookings with filters", async () => {
      const mockBookings = [{ id: "1", guestName: "John Doe" }];
      vi.mocked(api.get).mockResolvedValue({ data: mockBookings });

      const result = await bookingsService.getBookings({ status: "CONFIRMED" });

      expect(api.get).toHaveBeenCalledWith("/v1/vendor/bookings", {
        params: { status: "CONFIRMED" },
      });
      expect(result).toEqual(mockBookings);
    });
  });

  describe("checkIn", () => {
    it("should check in a booking", async () => {
      const mockResponse = { data: { id: "1", status: "CHECKED_IN" } };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await bookingsService.checkIn("booking-1");

      expect(api.post).toHaveBeenCalledWith("/v1/vendor/bookings/booking-1/check-in");
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("checkOut", () => {
    it("should check out a booking", async () => {
      const mockResponse = { data: { id: "1", status: "CHECKED_OUT" } };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await bookingsService.checkOut("booking-1");

      expect(api.post).toHaveBeenCalledWith("/v1/vendor/bookings/booking-1/check-out");
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getInvoice", () => {
    it("should fetch booking invoice", async () => {
      const mockInvoice = { invoiceNumber: "INV-001", totalAmount: 5000 };
      vi.mocked(api.get).mockResolvedValue({ data: mockInvoice });

      const result = await bookingsService.getInvoice("booking-1");

      expect(api.get).toHaveBeenCalledWith("/v1/vendor/bookings/booking-1/invoice");
      expect(result).toEqual(mockInvoice);
    });
  });
});
