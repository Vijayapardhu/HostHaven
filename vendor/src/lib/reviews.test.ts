import { describe, it, expect, vi, beforeEach } from "vitest";
import { reviewsService } from "./reviews";
import api from "./api";

vi.mock("./api");

describe("reviewsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getReviews", () => {
    it("should fetch all reviews", async () => {
      const mockReviews = [
        { id: "1", rating: 5, comment: "Excellent stay!" },
        { id: "2", rating: 4, comment: "Good service" },
      ];
      vi.mocked(api.get).mockResolvedValue({ data: mockReviews });

      const result = await reviewsService.getReviews();

      expect(api.get).toHaveBeenCalledWith("/v1/reviews/vendor", { params: undefined });
      expect(result).toEqual(mockReviews);
    });

    it("should fetch reviews with filters", async () => {
      const mockReviews = [{ id: "1", rating: 5 }];
      vi.mocked(api.get).mockResolvedValue({ data: mockReviews });

      const result = await reviewsService.getReviews({ propertyId: "prop-1" });

      expect(api.get).toHaveBeenCalledWith("/v1/reviews/vendor", {
        params: { propertyId: "prop-1" },
      });
      expect(result).toEqual(mockReviews);
    });
  });
});
