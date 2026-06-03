import { describe, it, expect, vi, beforeEach } from "vitest";
import { earningsService } from "./earnings";
import api from "./api";

vi.mock("./api");

describe("earningsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getEarningsSummary", () => {
    it("should fetch earnings summary", async () => {
      const mockSummary = {
        totalEarnings: 50000,
        thisMonth: 15000,
        pendingPayouts: 5000,
        commission: 2500,
      };
      vi.mocked(api.get).mockResolvedValue({ data: mockSummary });

      const result = await earningsService.getEarningsSummary();

      expect(api.get).toHaveBeenCalledWith("/v1/vendor/earnings/summary");
      expect(result).toEqual(mockSummary);
    });
  });

  describe("getPayoutHistory", () => {
    it("should fetch payout history", async () => {
      const mockPayouts = [
        { id: "1", amount: 10000, status: "PAID", date: "2026-02-01" },
      ];
      vi.mocked(api.get).mockResolvedValue({ data: mockPayouts });

      const result = await earningsService.getPayoutHistory();

      expect(api.get).toHaveBeenCalledWith("/v1/vendor/earnings/payouts", {
        params: undefined,
      });
      expect(result).toEqual(mockPayouts);
    });

    it("should fetch payout history with params", async () => {
      const mockPayouts: unknown[] = [];
      vi.mocked(api.get).mockResolvedValue({ data: mockPayouts });

      await earningsService.getPayoutHistory({ status: "PENDING" });

      expect(api.get).toHaveBeenCalledWith("/v1/vendor/earnings/payouts", {
        params: { status: "PENDING" },
      });
    });
  });
});
