import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist, WishlistItem } from "@/contexts/WishlistContext";

interface WishlistButtonProps {
  item: WishlistItem;
  variant?: "default" | "icon" | "card";
  className?: string;
}

const WishlistButton = ({ item, variant = "default", className = "" }: WishlistButtonProps) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(item.id);

  if (variant === "icon") {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(item);
        }}
        className={`p-2 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card transition-colors ${className}`}
      >
        <Heart
          className={`w-5 h-5 transition-colors ${
            inWishlist ? "text-primary fill-primary" : "text-muted-foreground"
          }`}
        />
      </button>
    );
  }

  if (variant === "card") {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(item);
        }}
        className={`absolute top-3 right-3 p-2 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card transition-colors z-10 ${className}`}
      >
        <Heart
          className={`w-5 h-5 transition-colors ${
            inWishlist ? "text-primary fill-primary" : "text-muted-foreground"
          }`}
        />
      </button>
    );
  }

  return (
    <Button
      variant={inWishlist ? "default" : "outline"}
      size="sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(item);
      }}
      className={className}
    >
      <Heart className={`w-4 h-4 mr-2 ${inWishlist ? "fill-current" : ""}`} />
      {inWishlist ? "Saved" : "Save"}
    </Button>
  );
};

export default WishlistButton;
