import { describe, it, expect, vi, beforeEach } from "vitest";
import { bookingsService } from "./bookings";
import api from "./api";

vi.mock("./api");

describe("bookingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBookings", () => {
    it("should parse bookings from canonical envelope (data.data.bookings)", async () => {
      const rawBooking = {
        id: "1",
        bookingNumber: "BK001",
        userId: "u1",
        propertyId: "p1",
        checkInDate: "2026-04-01",
        checkOutDate: "2026-04-03",
        totalAmount: "5000",
        status: "CONFIRMED",
        paymentStatus: "PAID",
        createdAt: "2026-03-01T00:00:00Z",
      };
      vi.mocked(api.get).mockResolvedValue({
        data: {
          success: true,
          data: { bookings: [rawBooking] },
          meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
          timestamp: "2026-03-01T00:00:00Z",
        },
      });

      const result = await bookingsService.getBookings({ status: "CONFIRMED" });

      expect(api.get).toHaveBeenCalledWith("/v1/bookings/vendor/bookings", {
        params: { status: "CONFIRMED" },
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("1");
      expect(result.data[0].totalAmount).toBe(5000);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });

    it("should parse bookings when data.data is a direct array", async () => {
      const rawBookings = [
        {
          id: "2",
          bookingNumber: "BK002",
          userId: "u2",
          propertyId: "p2",
          checkInDate: "2026-05-01",
          checkOutDate: "2026-05-02",
          totalAmount: 2000,
          status: "PENDING",
          paymentStatus: "UNPAID",
          createdAt: "2026-04-01T00:00:00Z",
        },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: {
          success: true,
          data: rawBookings,
          meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      });

      const result = await bookingsService.getBookings({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("2");
      expect(result.pagination.total).toBe(1);
    });

    it("should return empty data and default pagination when response is empty", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: { bookings: [] }, meta: { page: 1, limit: 10, total: 0, totalPages: 0 } },
      });

      const result = await bookingsService.getBookings({});

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it("should return safe defaults when API returns unexpected shape", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: null });

      const result = await bookingsService.getBookings({});

      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({ total: 0, page: 1, limit: 10, totalPages: 1 });
    });
  });

  describe("checkIn", () => {
    it("should check in a booking", async () => {
      const mockResponse = { data: { id: "1", status: "CHECKED_IN" } };
      vi.mocked(api.put).mockResolvedValue(mockResponse);

      const result = await bookingsService.checkIn("booking-1");

      expect(api.put).toHaveBeenCalledWith("/v1/bookings/vendor/booking-1/check-in");
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("checkOut", () => {
    it("should check out a booking", async () => {
      const mockResponse = { data: { id: "1", status: "CHECKED_OUT" } };
      vi.mocked(api.put).mockResolvedValue(mockResponse);

      const result = await bookingsService.checkOut("booking-1");

      expect(api.put).toHaveBeenCalledWith("/v1/bookings/vendor/booking-1/check-out");
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getInvoice", () => {
    it("should fetch booking invoice", async () => {
      const mockInvoice = { invoiceNumber: "INV-001", totalAmount: 5000 };
      vi.mocked(api.get).mockResolvedValue({ data: mockInvoice });

      const result = await bookingsService.getInvoice("booking-1");

      expect(api.get).toHaveBeenCalledWith("/v1/bookings/vendor/booking-1/invoice");
      expect(result).toEqual(mockInvoice);
    });
  });
});
