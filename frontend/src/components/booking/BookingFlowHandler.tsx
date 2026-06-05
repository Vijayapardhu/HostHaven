import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FocusTrap } from "@/components/ui/FocusTrap";
import { useAuth } from "@/contexts/AuthContext";

const VIDEO_WATCHED_KEY = "video_watched";

interface BookingFlowState {
  showVideo: boolean;
  hasWatchedVideo: boolean;
  showLoginPrompt: boolean;
  currentRoomId?: string;
  currentVideoUrl?: string;
}

export function useBookingFlow(propertyId: string, propertyType: string) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [state, setState] = useState<BookingFlowState>({
    showVideo: false,
    hasWatchedVideo: false,
    showLoginPrompt: false,
  });

  const checkVideoWatched = (roomId: string): boolean => {
    const watchedData = localStorage.getItem(VIDEO_WATCHED_KEY);
    if (watchedData) {
      try {
        const watched = JSON.parse(watchedData);
        const watchedAt = watched[`${propertyId}_${roomId}`];
        return watchedAt && Date.now() - watchedAt < 24 * 60 * 60 * 1000;
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  const markVideoWatched = (roomId: string) => {
    setState(s => ({ ...s, hasWatchedVideo: true }));
    const watchedData = localStorage.getItem(VIDEO_WATCHED_KEY);
    let watched: Record<string, number> = {};
    if (watchedData) {
      try { watched = JSON.parse(watchedData); } catch {
        watched = {};
      }
    }
    watched[`${propertyId}_${roomId}`] = Date.now();
    localStorage.setItem(VIDEO_WATCHED_KEY, JSON.stringify(watched));
  };

  const saveBookingIntent = (roomId?: string) => {
    const params = new URLSearchParams(window.location.search);
    sessionStorage.setItem("booking_intent", JSON.stringify({
      propertyId,
      propertyType,
      roomId,
      checkIn: params.get("checkIn") || undefined,
      checkOut: params.get("checkOut") || undefined,
      guests: params.get("guests") || "2",
      needsVideoWatch: Boolean(roomId),
    }));
  };

  const proceedToBooking = (roomId?: string) => {
    const params = new URLSearchParams(window.location.search);
    if (roomId) params.set("roomId", roomId);
    navigate(`/booking/${propertyId}?${params.toString()}`);
  };

  const handleRoomBook = (roomId: string, videoUrl?: string) => {
    if (!isAuthenticated) {
      saveBookingIntent(roomId);
      setState(s => ({ ...s, showLoginPrompt: true }));
      return;
    }

    if (videoUrl && !checkVideoWatched(roomId)) {
      setState(s => ({
        ...s,
        showVideo: true,
        currentRoomId: roomId,
        currentVideoUrl: videoUrl,
        hasWatchedVideo: false,
      }));
      return;
    }

    proceedToBooking(roomId);
  };

  const handleQuickBook = () => {
    if (!isAuthenticated) {
      saveBookingIntent();
      setState(s => ({ ...s, showLoginPrompt: true }));
      return;
    }
    
    proceedToBooking();
  };

  const handleLoginRedirect = () => {
    saveBookingIntent(state.currentRoomId);
    const params = new URLSearchParams(window.location.search);
    navigate("/login", { state: { from: `/${propertyType}/${propertyId}?${params.toString()}` } });
  };

  const handleCloseVideo = () => {
    setState(s => ({
      ...s,
      showVideo: false,
      currentRoomId: undefined,
      currentVideoUrl: undefined,
      hasWatchedVideo: false,
    }));
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.currentTime / video.duration > 0.9 && state.currentRoomId && !state.hasWatchedVideo) {
      markVideoWatched(state.currentRoomId);
    }
  };

  const handleVideoEnded = () => {
    if (state.currentRoomId) {
      markVideoWatched(state.currentRoomId);
    }
  };

  return {
    ...state,
    currentVideoUrl: state.currentVideoUrl,
    currentRoomId: state.currentRoomId,
    videoRef,
    handleRoomBook,
    handleQuickBook,
    handleLoginRedirect,
    handleCloseVideo,
    handleVideoTimeUpdate,
    handleVideoEnded,
    proceedToBooking,
    setShowLoginPrompt: (show: boolean) => setState(s => ({ ...s, showLoginPrompt: show })),
  };
}

// Video Modal Component
interface VideoModalProps {
  isOpen: boolean;
  videoUrl: string;
  onClose: () => void;
  onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onEnded: () => void;
  hasWatched: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onProceed: () => void;
}

export function VideoModal({ isOpen, videoUrl, onClose, onTimeUpdate, onEnded, hasWatched, videoRef, onProceed }: VideoModalProps) {
  if (!isOpen) return null;

  return (
    <FocusTrap active={isOpen}>
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Video Tour">
        <div className="relative w-full max-w-2xl bg-black rounded-xl overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 bg-white/20 hover:bg-white/30 rounded-full p-2 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video"
          controls
          autoPlay
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
        />
        <div className="p-3 bg-zinc-900 text-center">
          {hasWatched ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-green-400 text-sm flex items-center gap-2">
                ✓ Video watched successfully
              </p>
              <Button variant="default" size="sm" onClick={onProceed}>
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
    </FocusTrap>
  );
}

// Login Prompt Modal Component
interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export function LoginPromptModal({ isOpen, onClose, onLogin }: LoginPromptModalProps) {
  if (!isOpen) return null;

  return (
    <FocusTrap active={isOpen}>
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="login-prompt-title">
        <div className="bg-card rounded-xl p-6 max-w-sm w-full shadow-xl">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 id="login-prompt-title" className="text-lg font-semibold mb-2">Login Required</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Please login to book this property and watch room videos.
          </p>
          <div className="space-y-3">
            <Button variant="default" className="w-full" onClick={onLogin}>
              Login to Continue
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
      </div>
    </FocusTrap>
  );
}
