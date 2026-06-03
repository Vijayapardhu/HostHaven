import { useState, useRef } from "react";
import { Star, Upload, X, Image, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { handleError } from "@/lib/errorHandler";
import { getFieldHint, validateField } from "@/lib/formValidation";

interface ReviewFormProps {
  propertyId: string;
  bookingId?: string;
  propertyName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const StarRating = ({ 
  value, 
  onChange, 
  label,
  size = "md" 
}: { 
  value: number; 
  onChange: (v: number) => void;
  label?: string;
  size?: "sm" | "md" | "lg";
}) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };
  
  return (
    <div className="flex items-center gap-1">
      {label && <span className="text-sm text-gray-600 mr-2">{label}</span>}
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
          title={`Rate ${star} star${star > 1 ? 's' : ''}`}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={`${sizes[size]} transition-colors ${
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300 hover:text-amber-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default function ReviewForm({ propertyId, bookingId, propertyName, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [service, setService] = useState(0);
  const [location, setLocation] = useState(0);
  const [value, setValue] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "reviews");
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/v1'}/uploads/image`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("accessToken") || localStorage.getItem("access_token")}`
          },
          body: formData
        });
        
        const result = await response.json();
        if (result.data?.url) {
          setImages(prev => [...prev, result.data.url]);
        }
      }
    } catch (error) {
      handleError(error, 'api');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ratingValidation = validateField("reviewRating", rating);
    if (!ratingValidation.valid) {
      const message = ratingValidation.errors[0] || "Please select a valid rating";
      setRatingError(message);
      handleError(new Error(message), 'api', { title: 'Rating Required' });
      return;
    }

    setRatingError("");

    const commentValidation = validateField("reviewComment", comment);
    if (!commentValidation.valid) {
      const message = commentValidation.errors[0] || "Please write at least 10 characters";
      setCommentError(message);
      handleError(new Error(message), 'api', { title: 'Comment Required' });
      return;
    }

    setCommentError("");

    setIsSubmitting(true);
    try {
      await api.reviews.create({
        propertyId,
        bookingId,
        rating,
        title: title || undefined,
        comment,
        cleanliness: cleanliness || undefined,
        service: service || undefined,
        location: location || undefined,
        value: value || undefined,
        images: images.length > 0 ? images : undefined,
        videos: videos.length > 0 ? videos : undefined,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      handleError(error, 'api');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Rate Your Stay</h3>
        <p className="text-gray-500">How was your experience at {propertyName}?</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div className="flex flex-col items-center py-4 bg-gray-50 rounded-xl">
          <span className="text-sm text-gray-600 mb-3">Overall Rating</span>
          <StarRating
            value={rating}
            onChange={(value) => {
              setRating(value);
              setRatingError("");
            }}
            size="lg"
          />
          <span className="text-sm text-gray-400 mt-2">
            {rating === 0 && "Tap to rate"}
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </span>
          {ratingError ? <p className="mt-2 text-xs text-rose-600">{ratingError}</p> : <p className="mt-2 text-xs text-gray-500">{getFieldHint("reviewRating")}</p>}
        </div>

        {/* Category Ratings */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Cleanliness</p>
            <StarRating value={cleanliness} onChange={setCleanliness} size="sm" />
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Service</p>
            <StarRating value={service} onChange={setService} size="sm" />
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Location</p>
            <StarRating value={location} onChange={setLocation} size="sm" />
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Value</p>
            <StarRating value={value} onChange={setValue} size="sm" />
          </div>
        </div>

        {/* Title */}
        <div>
          <input
            type="text"
            placeholder="Give your review a title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            maxLength={100}
          />
        </div>

        {/* Comment */}
        <div>
          <Textarea
            placeholder="Share your experience... (minimum 10 characters)"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (commentError) {
                const result = validateField("reviewComment", e.target.value);
                setCommentError(result.valid ? "" : (result.errors[0] || "Invalid review comment"));
              }
            }}
            className="min-h-[120px] resize-none border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
            maxLength={2000}
          />
          {commentError ? <p className="text-xs text-rose-600 mt-1">{commentError}</p> : <p className="text-xs text-gray-500 mt-1">{getFieldHint("reviewComment")}</p>}
          <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/2000</p>
        </div>

        {/* Media Upload */}
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Add photos or videos (optional)</p>
          
          <div className="flex gap-3">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              title="Upload review photos"
              aria-label="Upload review photos"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              title="Upload review videos"
              aria-label="Upload review videos"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <Image className="w-4 h-4" />
              Add Photos
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              Add Videos
            </Button>
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading media...
            </div>
          )}

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((url, index) => (
                <div key={index} className="relative group">
                  <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || rating === 0} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
