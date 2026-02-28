import { useState, useEffect } from "react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { motion } from "framer-motion";
import { Star, Search, Filter, MessageCircle, ThumbsUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { reviewsService } from "@/lib/reviews";
import { vendorService } from "@/lib/vendor";

interface Review {
  id: string;
  rating: number;
  comment: string;
  isPublic: boolean;
  createdAt: string;
  property: { id: string; name: string };
  user: { name: string; avatarUrl?: string };
  vendorResponse?: string;
}

const VendorReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const properties = await vendorService.getProperties();
      if (properties.properties && properties.properties.length > 0) {
        const allReviews: Review[] = [];
        for (const prop of properties.properties) {
          try {
            const revs = await reviewsService.getReviewsByProperty(prop.id);
            if (revs && Array.isArray(revs)) {
              allReviews.push(...revs.map((r: any) => ({ ...r, property: { id: prop.id, name: prop.name } })));
            }
          } catch { }
        }
        setReviews(allReviews);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (reviewId: string) => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await reviewsService.respondToReview(reviewId, replyText);
      // Update local state instead of refetching all
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, vendorResponse: replyText } : r));
      setReplyingTo(null);
      setReplyText("");
    } catch (error) {
      console.error("Failed to respond to review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch = r.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.property.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = ratingFilter === "all" || r.rating === parseInt(ratingFilter);
    return matchesSearch && matchesRating;
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

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
                <Star key={star} className={`w-5 h-5 ${star <= Math.round(Number(averageRating)) ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{reviews.length} reviews</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">5 Stars</p>
            <div className="flex items-center gap-2 mt-1">
              <ProgressBar
                value={reviews.filter(r => r.rating === 5).length}
                max={reviews.length || 1}
                className="flex-1"
                barClassName="bg-amber-500"
              />
              <span className="text-sm">{reviews.filter(r => r.rating === 5).length}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">1-2 Stars</p>
            <div className="flex items-center gap-2 mt-1">
              <ProgressBar
                value={reviews.filter(r => r.rating <= 2).length}
                max={reviews.length || 1}
                className="flex-1"
                barClassName="bg-red-500"
              />
              <span className="text-sm">{reviews.filter(r => r.rating <= 2).length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search reviews..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Filter by rating" /></SelectTrigger>
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
        <div className="space-y-4">{[1, 2, 3].map((i) => (<div key={i} className="h-32 bg-muted rounded-2xl animate-pulse"></div>))}</div>
      ) : filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredReviews.map((review, index) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{review.user?.name || "Anonymous Guest"}</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-4 h-4 ${star <= review.rating ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{review.property?.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="mt-3 text-sm">{review.comment}</p>

                  {review.vendorResponse ? (
                    <div className="mt-4 bg-muted/50 rounded-lg p-3 border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageCircle className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm">Your Response</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.vendorResponse}</p>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t">
                      {replyingTo === review.id ? (
                        <div className="space-y-3">
                          <Input
                            placeholder="Write your response..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            disabled={isSubmitting}
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { setReplyingTo(null); setReplyText(""); }}>Cancel</Button>
                            <Button size="sm" onClick={() => handleRespond(review.id)} disabled={isSubmitting || !replyText.trim()}>Submit Response</Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setReplyingTo(review.id)}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Reply to Review
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
            <p className="text-muted-foreground">Customer reviews will appear here</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendorReviews;
