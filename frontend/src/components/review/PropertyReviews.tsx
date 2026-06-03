import { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { ReviewCard, Review, RatingBreakdown } from "./ReviewCard";
import { Button } from "@/components/ui/button";

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  breakdown?: {
    cleanliness?: number;
    service?: number;
    location?: number;
    value?: number;
  };
}

interface PropertyReviewsProps {
  propertyId: string;
  showStats?: boolean;
}

export function PropertyReviews({ propertyId, showStats = true }: PropertyReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const limit = 10;

  useEffect(() => {
    fetchReviews();
  }, [propertyId, page, filterRating]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
      };
      if (filterRating) {
        params.rating = filterRating.toString();
      }

      const response = await api.reviews.getByProperty(propertyId, params);
      
      if (response?.reviews) {
        setReviews(response.reviews);
        setStats(response.stats || null);
        setTotalPages(response.meta?.totalPages || 1);
      } else {
        setReviews(response?.data?.reviews || []);
        setStats(response?.data?.stats || null);
        setTotalPages(response?.data?.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterByRating = (rating: number | null) => {
    setFilterRating(rating);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showStats && stats && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <RatingBreakdown
              averageRating={stats.averageRating}
              totalReviews={stats.totalReviews}
              breakdown={stats.breakdown}
            />
          </div>
          
          <div className="md:col-span-2">
            <div className="bg-card rounded-xl p-5 shadow-card border">
              <h3 className="font-semibold mb-4">Filter by Rating</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterRating === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterByRating(null)}
                >
                  All
                </Button>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <Button
                    key={rating}
                    variant={filterRating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterByRating(rating)}
                    className="flex items-center gap-1"
                  >
                    <Star className="w-4 h-4 fill-current" />
                    {rating}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border">
          <p className="text-muted-foreground">No reviews yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
