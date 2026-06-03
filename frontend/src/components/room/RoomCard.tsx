import { useState, useRef, useEffect } from "react";
import { Play, X, Lock, Loader2, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Room {
  id: string;
  name: string;
  capacity: number;
  pricePerNight: number;
  video?: string;
  images?: Array<{ url: string; alt?: string }>;
}

interface RoomCardProps {
  room: Room;
  hotelId: string;
  checkIn?: Date;
  checkOut?: Date;
  guests: number;
  onBookNow: (roomId: string) => void;
}

const STORAGE_KEY = "booking_intent";
const VIDEO_WATCHED_KEY = "video_watched";

interface BookingIntent {
  hotelId: string;
  roomId: string;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  needsVideoWatch: boolean;
}

export function RoomCard({ room, hotelId, checkIn, checkOut, guests, onBookNow }: RoomCardProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [showVideo, setShowVideo] = useState(false);
  const [hasWatchedVideo, setHasWatchedVideo] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showRoomGallery, setShowRoomGallery] = useState(false);
  const [currentRoomImageIndex, setCurrentRoomImageIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const roomImages = room.images?.map((img: any) => typeof img === 'string' ? img : img?.url).filter(Boolean) || [];
  const hasMultipleImages = roomImages.length > 1;
  const getPosterUrl = () => {
    const first = room.images?.[0];
    if (!first) return undefined;
    return typeof first === 'string' ? first : first?.url;
  };

  // Check if user already watched this video (from localStorage)
  useEffect(() => {
    if (isAuthenticated && room.video) {
      const watchedData = localStorage.getItem(VIDEO_WATCHED_KEY);
      if (watchedData) {
        try {
          const watched = JSON.parse(watchedData);
          const watchedAt = watched[`${hotelId}_${room.id}`];
          // Video watch state expires after 24 hours
          if (watchedAt && Date.now() - watchedAt < 24 * 60 * 60 * 1000) {
            setHasWatchedVideo(true);
          }
        } catch (e) {
          console.error("Failed to parse video watched state", e);
        }
      }
    }
  }, [isAuthenticated, room.video, hotelId, room.id]);

  // Check for stored booking intent on mount (after login redirect)
  useEffect(() => {
    if (isAuthenticated) {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const intent: BookingIntent = JSON.parse(stored);
          if (intent.roomId === room.id && intent.needsVideoWatch) {
            // User just logged in and needs to watch video
            sessionStorage.removeItem(STORAGE_KEY);
            // Small delay to ensure component is ready
            setTimeout(() => setShowVideo(true), 100);
          }
        } catch (e) {
          console.error("Failed to parse booking intent", e);
        }
      }
    }
  }, [isAuthenticated, room.id]);

  // Keyboard navigation for room gallery
  useEffect(() => {
    if (!showRoomGallery || roomImages.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowRoomGallery(false);
      if (e.key === "ArrowLeft") setCurrentRoomImageIndex((prev) => (prev - 1 + roomImages.length) % roomImages.length);
      if (e.key === "ArrowRight") setCurrentRoomImageIndex((prev) => (prev + 1) % roomImages.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showRoomGallery, roomImages.length]);

  const saveBookingIntent = (needsVideo: boolean) => {
    const intent: BookingIntent = {
      hotelId,
      roomId: room.id,
      checkIn: checkIn?.toISOString(),
      checkOut: checkOut?.toISOString(),
      guests,
      needsVideoWatch: needsVideo,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
  };

  const markVideoWatched = () => {
    setHasWatchedVideo(true);
    // Save to localStorage with timestamp
    const watchedData = localStorage.getItem(VIDEO_WATCHED_KEY);
    let watched: Record<string, number> = {};
    if (watchedData) {
      try {
        watched = JSON.parse(watchedData);
      } catch (e) {
        console.error("Failed to parse watched data", e);
      }
    }
    watched[`${hotelId}_${room.id}`] = Date.now();
    localStorage.setItem(VIDEO_WATCHED_KEY, JSON.stringify(watched));
  };

  const handlePlayVideo = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    setShowVideo(true);
  };

  const handleVideoEnd = () => {
    markVideoWatched();
  };

  const handleCloseVideo = () => {
    setShowVideo(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleLoginClick = () => {
    setIsLoggingIn(true);
    // Save booking intent before redirecting
    const needsVideo = Boolean(room.video && !hasWatchedVideo);
    saveBookingIntent(needsVideo);
    
    // Include current URL with query params for proper redirect
    const returnUrl = `${window.location.pathname}${window.location.search}`;
    navigate("/login", { state: { from: returnUrl } });
  };

  const handleBookClick = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    if (room.video && !hasWatchedVideo) {
      setShowVideo(true);
      return;
    }
    onBookNow(room.id);
  };

  // Determine button state
  const getButtonContent = () => {
    if (!isAuthenticated) {
      return (
        <>
          <Lock className="w-4 h-4 mr-2" />
          {room.video ? "Watch & Book" : "Book Now"}
        </>
      );
    }
    if (room.video && !hasWatchedVideo) {
      return (
        <>
          <Play className="w-4 h-4 mr-2" />
          Watch Video
        </>
      );
    }
    return "Book Now";
  };

  const isButtonDisabled = isLoggingIn;

  return (
    <>
      <div className="bg-card rounded-xl p-5 shadow-card border">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Room Image/Video Preview */}
          <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden relative bg-muted flex-shrink-0">
            {room.video ? (
              <div className="relative w-full h-full group">
                <video
                  src={room.video}
                  className="w-full h-full object-cover"
                  poster={getPosterUrl()}
                  preload="none"
                />
                <div 
                  className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer group-hover:bg-black/50 transition"
                  onClick={handlePlayVideo}
                >
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary ml-1" />
                  </div>
                </div>
                {room.video && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    Video Tour
                  </div>
                )}
              </div>
            ) : roomImages.length > 0 ? (
              <div className="relative w-full h-full group cursor-pointer" onClick={() => hasMultipleImages && setShowRoomGallery(true)}>
                <img 
                  src={roomImages[0]} 
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
                {hasMultipleImages && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="bg-white/90 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      View all ({roomImages.length})
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>

          {/* Room Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{room.name}</h3>
                <p className="text-muted-foreground text-sm">Up to {room.capacity} guests</p>
              </div>
              {room.video && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  Video Tour Available
                </span>
              )}
            </div>

            {room.video && isAuthenticated && !hasWatchedVideo && (
              <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                <Play className="w-3 h-3" />
                Watch the video tour to unlock booking
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-xl font-semibold text-foreground">
                  ₹{room.pricePerNight.toLocaleString()}
                  <span className="text-muted-foreground font-normal text-sm">/night</span>
                </p>
              </div>
              <Button
                variant="gold"
                onClick={handleBookClick}
                disabled={isButtonDisabled}
              >
                {isButtonDisabled ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  getButtonContent()
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-black rounded-xl overflow-hidden">
            <button
              onClick={handleCloseVideo}
              className="absolute top-3 right-3 z-10 bg-white/20 hover:bg-white/30 rounded-full p-2 transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <video
              ref={videoRef}
              src={room.video}
              className="w-full aspect-video"
              controls
              autoPlay
              onEnded={handleVideoEnd}
              onTimeUpdate={(e) => {
                const video = e.currentTarget;
                // Mark as watched if user has watched at least 90%
                if (video.currentTime / video.duration > 0.9 && !hasWatchedVideo) {
                  markVideoWatched();
                }
              }}
            />
            <div className="p-3 bg-zinc-900 text-center">
              {hasWatchedVideo ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-green-400 text-sm flex items-center gap-2">
                    ✓ Video watched successfully
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      handleCloseVideo();
                      onBookNow(room.id);
                    }}
                  >
                    Proceed to Book Now
                  </Button>
                </div>
              ) : (
                <p className="text-white/70 text-sm">
                  Please watch the full video to unlock booking
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Login Required</h3>
              <p className="text-muted-foreground text-sm mb-6">
                {room.video 
                  ? "Watch the room video tour and book your stay by logging in to your account."
                  : "Please login to book this room."
                }
              </p>
              <div className="space-y-3">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={handleLoginClick}
                >
                  Login to Continue
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowLoginPrompt(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Image Gallery Modal */}
      {showRoomGallery && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setShowRoomGallery(false)}>
          <button
            onClick={() => setShowRoomGallery(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
            title="Close gallery"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentRoomImageIndex((prev) => (prev - 1 + roomImages.length) % roomImages.length); }}
            className="absolute left-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentRoomImageIndex((prev) => (prev + 1) % roomImages.length); }}
            className="absolute right-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          <img 
            src={roomImages[currentRoomImageIndex]} 
            alt={`${room.name} ${currentRoomImageIndex + 1}`} 
            className="max-w-full max-h-full object-contain" 
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {roomImages.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentRoomImageIndex(idx); }}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === currentRoomImageIndex ? "w-8 bg-white" : "bg-white/50"
                )}
              />
            ))}
          </div>
          <div className="absolute top-4 left-4 text-white text-sm bg-black/30 px-3 py-1 rounded-full">
            {currentRoomImageIndex + 1} / {roomImages.length}
          </div>
        </div>
      )}
    </>
  );
}
