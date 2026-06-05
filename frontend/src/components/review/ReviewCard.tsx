import { Star, CheckCircle2, MessageSquare, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { FocusTrap } from "@/components/ui/FocusTrap";

export interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  cleanliness?: number;
  service?: number;
  location?: number;
  value?: number;
  isVerified: boolean;
  isVisible?: boolean;
  status?: "approved" | "pending" | "hidden";
  vendorResponse?: string;
  respondedAt?: string;
  images?: string[];
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface ReviewCardProps {
  review: Review;
}

const StarRating = ({ 
  value, 
  max = 5,
  size = "sm"
}: { 
  value: number; 
  max?: number;
  size?: "sm" | "md" | "lg";
}) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };
  
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(max)].map((_, i) => (
        <Star
          key={i}
          className={`${sizes[size]} ${
            i < value
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
};

const CategoryRating = ({ 
  label, 
  value 
}: { 
  label: string; 
  value?: number | null;
}) => {
  if (!value) return null;
  
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-400 rounded-full"
            style={{ width: `${(value / 5) * 100}%` }}
          />
        </div>
        <span className="text-gray-900 font-medium w-6 text-right">{value.toFixed(1)}</span>
      </div>
    </div>
  );
};

export function ReviewCard({ review }: ReviewCardProps) {
  const [showFullComment, setShowFullComment] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const commentLength = review.comment?.length || 0;
  const shouldTruncate = commentLength > 300;
  const reviewStatus = review.status || (review.isVisible === false ? "hidden" : review.isVerified ? "approved" : "pending");
  const statusLabel = reviewStatus === "approved" ? "Verified stay" : reviewStatus === "pending" ? "Pending review" : "Hidden";
  const statusClassName =
    reviewStatus === "approved"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : reviewStatus === "pending"
        ? "bg-amber-50 text-amber-700 border-amber-100"
        : "bg-slate-100 text-slate-600 border-slate-200";

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageOpen(true);
  };

  return (
    <div className="bg-card rounded-xl p-4 md:p-5 shadow-card border w-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            {review.user?.avatarUrl ? (
              <img 
                src={review.user.avatarUrl} 
                alt={review.user.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold">
                {(review.user?.name || "G").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <p className="text-sm font-semibold text-foreground truncate min-w-0">
                {review.user?.name || "Guest"}
              </p>
              {review.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
            <div className="mt-1">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClassName}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <StarRating value={review.rating} size="md" />
          <span className="text-sm font-semibold ml-1">{Number(review.rating).toFixed(1)}</span>
        </div>
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="mb-2 break-words font-semibold text-foreground">{review.title}</h4>
      )}

      {/* Comment */}
      <div className="mb-4">
        <p className={`text-sm text-muted-foreground whitespace-pre-wrap break-words ${!showFullComment && shouldTruncate ? 'line-clamp-4' : ''}`}>
          {review.comment}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setShowFullComment(!showFullComment)}
            className="text-sm text-primary hover:underline mt-1"
          >
            {showFullComment ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      {/* Category Ratings */}
      {(review.cleanliness || review.service || review.location || review.value) && (
        <div className="mb-4 grid grid-cols-1 gap-2 rounded-lg bg-gray-50 p-3 md:grid-cols-2 md:gap-3">
          {review.cleanliness && <CategoryRating label="Cleanliness" value={review.cleanliness} />}
          {review.service && <CategoryRating label="Service" value={review.service} />}
          {review.location && <CategoryRating label="Location" value={review.location} />}
          {review.value && <CategoryRating label="Value" value={review.value} />}
        </div>
      )}

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
          {review.images.slice(0, 4).map((img, idx) => (
            <div key={idx} className="relative flex-shrink-0">
              <img 
                src={img} 
                alt={`Review image ${idx + 1}`}
                className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openImageViewer(idx)}
              />
              {idx === 3 && review.images.length > 4 && (
                <div 
                  className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center cursor-pointer"
                  onClick={() => openImageViewer(idx)}
                >
                  <span className="text-white text-sm font-medium">
                    +{review.images.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vendor Response */}
      {review.vendorResponse && (
        <div className="mt-4 pl-4 border-l-2 border-primary/20 bg-primary/5 rounded-r-lg p-3">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <MessageSquare className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm font-medium text-primary">Host Response</span>
            {review.respondedAt && (
              <span className="text-xs text-muted-foreground">
                • {new Date(review.respondedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{review.vendorResponse}</p>
        </div>
      )}

      {/* Image Viewer Modal */}
      {isImageOpen && (
        <FocusTrap active={isImageOpen}>
          <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsImageOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Image Viewer"
          >
            <button
              onClick={() => setIsImageOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            
            {review.images && review.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev - 1 + review.images!.length) % review.images!.length);
                  }}
                  className="absolute left-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev + 1) % review.images!.length);
                  }}
                  className="absolute right-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
          
          <img
            src={review.images?.[selectedImageIndex]}
            alt={`Review image ${selectedImageIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {selectedImageIndex + 1} / {review.images?.length}
          </div>
        </div>
      </FocusTrap>
      )}
    </div>
  );
}

interface RatingBreakdownProps {
  averageRating: number;
  totalReviews: number;
  breakdown?: {
    cleanliness?: number;
    service?: number;
    location?: number;
    value?: number;
  };
}

export function RatingBreakdown({ averageRating, totalReviews, breakdown }: RatingBreakdownProps) {
  return (
    <div className="bg-card rounded-xl p-5 shadow-card border">
      <div className="flex items-center gap-4 mb-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-foreground">{averageRating.toFixed(1)}</div>
          <StarRating value={Math.round(averageRating)} size="md" />
          <p className="text-sm text-muted-foreground mt-1">{totalReviews} reviews</p>
        </div>
      </div>

      {breakdown && (
        <div className="space-y-3">
          <CategoryRating label="Cleanliness" value={breakdown.cleanliness} />
          <CategoryRating label="Service" value={breakdown.service} />
          <CategoryRating label="Location" value={breakdown.location} />
          <CategoryRating label="Value" value={breakdown.value} />
        </div>
      )}
    </div>
  );
}
