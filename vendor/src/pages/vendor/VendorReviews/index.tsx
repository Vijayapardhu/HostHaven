import { useEffect, useState } from "react";
import { Star, Search, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { reviewsService } from "@/lib/reviews";
import { useToast } from "@/hooks/use-toast";
import LoadingState from "@/components/states/LoadingState";
import EmptyState from "@/components/states/EmptyState";

interface ReviewRecord {
  id: string;
  rating: number;
  comment?: string;
  user?: { name: string };
  property?: { name: string };
  createdAt: string;
}

const VendorReviewsIndex = () => {
  const { toast } = useToast();

  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const response = await reviewsService.getReviews();
      const reviewList = Array.isArray(response) ? response : response?.reviews || [];
      setReviews(reviewList);
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to load reviews", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  const filteredReviews = reviews.filter((review) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || review.comment?.toLowerCase().includes(query) || review.user?.name?.toLowerCase().includes(query);
    const matchesRating = ratingFilter === "all" || review.rating === parseInt(ratingFilter);
    return matchesSearch && matchesRating;
  });

  const averageRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Reviews</h1>
          <p className="text-muted-foreground mt-1">Manage customer feedback</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-4xl font-bold text-amber-500">{averageRating}</p>
            <div className="flex justify-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(Number(averageRating)) ? "text-amber-500 fill-amber-500" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{reviews.length} reviews</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reviews..." className="pl-9" />
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingState message="Loading reviews..." />
      ) : filteredReviews.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="w-12 h-12 text-muted" />}
          title="No reviews yet"
          description="Customer reviews will appear here."
        />
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{review.user?.name || "Guest"}</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating ? "text-amber-500 fill-amber-500" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{review.property?.name || ""}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                {review.comment && <p className="mt-3 text-sm">{review.comment}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorReviewsIndex;
