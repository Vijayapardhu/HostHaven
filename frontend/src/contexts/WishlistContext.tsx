import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface WishlistItem {
  id: string;
  type: "hotel" | "home" | "temple";
  name: string;
  location: string;
  image: string;
  price?: number;
  rating?: number;
  wishlistId?: string; // backend record ID
}

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string, type?: WishlistItem["type"]) => void;
  isInWishlist: (id: string, type?: WishlistItem["type"]) => boolean;
  toggleWishlist: (item: WishlistItem) => void;
  syncWithBackend: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const isLoggedIn = () => {
  try {
    const stored = localStorage.getItem("hosthaven_auth");
    if (stored) {
      const authData = JSON.parse(stored);
      if (authData.accessToken || authData.token) return true;
    }
  } catch (error) {
    console.warn("Failed to read auth from localStorage", error);
  }
  // Fallback to old keys
  return !!localStorage.getItem("accessToken") || !!localStorage.getItem("vendorToken");
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<WishlistItem[]>([]);

  const loadFromBackend = useCallback(async () => {
    if (!isLoggedIn()) return;
    try {
      const data = await api.wishlist.getAll();
      const backendItems: WishlistItem[] = (Array.isArray(data?.data) ? data.data : []).map((w) => ({
        id: w.itemId,
        type: w.itemType,
        name: w.itemName,
        location: w.itemLocation,
        image: w.itemImage,
        price: w.itemPrice ? Number(w.itemPrice) : undefined,
        rating: w.itemRating ? Number(w.itemRating) : undefined,
        wishlistId: w.id,
      }));
      setItems(backendItems);
      localStorage.setItem("hosthaven_wishlist", JSON.stringify(backendItems));
    } catch (error) {
      console.warn("Failed to load wishlist from backend, falling back to localStorage:", error);
      const stored = localStorage.getItem("hosthaven_wishlist");
      if (stored) {
        try { 
          setItems(JSON.parse(stored)); 
        } catch (parseError) {
          console.error("Failed to parse localStorage wishlist:", parseError);
          localStorage.removeItem("hosthaven_wishlist");
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn()) {
      loadFromBackend();
    } else {
      const stored = localStorage.getItem("hosthaven_wishlist");
      if (stored) {
        try { 
          setItems(JSON.parse(stored)); 
        } catch (error) {
          console.error("Failed to parse localStorage wishlist:", error);
          localStorage.removeItem("hosthaven_wishlist");
        }
      }
    }
  }, [loadFromBackend]);

  useEffect(() => {
    localStorage.setItem("hosthaven_wishlist", JSON.stringify(items));
  }, [items]);

  const addToWishlist = async (item: WishlistItem) => {
    if (items.some((i) => i.id === item.id && i.type === item.type)) return;
    const newItem = { ...item };
    setItems((prev) => [...prev, newItem]);
    if (isLoggedIn()) {
      try {
        const result = await api.wishlist.add({
          itemType: item.type,
          itemId: item.id,
          itemName: item.name,
          itemImage: item.image,
          itemLocation: item.location,
          itemPrice: item.price,
          itemRating: item.rating,
        });
        const wishlistId = result?.item?.id || result?.id;
        if (wishlistId) {
          setItems((prev) => prev.map((i) => (i.id === item.id && i.type === item.type) ? { ...i, wishlistId } : i));
        }
      } catch (error) {
        console.error("Failed to add to wishlist:", error);
        setItems((prev) => prev.filter((i) => !(i.id === item.id && i.type === item.type)));
      }
    }
  };

  const removeFromWishlist = async (id: string, type?: WishlistItem["type"]) => {
    const item = items.find((i) => i.id === id && (!type || i.type === type));
    setItems((prev) => prev.filter((i) => !(i.id === id && (!type || i.type === type))));
    if (isLoggedIn() && item?.wishlistId) {
      try { 
        await api.wishlist.remove(item.wishlistId); 
      } catch (error) {
        console.error("Failed to remove from wishlist:", error);
      }
    }
  };

  const isInWishlist = (id: string, type?: WishlistItem["type"]) =>
    items.some((item) => item.id === id && (!type || item.type === type));

  const toggleWishlist = (item: WishlistItem) => {
    if (isInWishlist(item.id, item.type)) {
      removeFromWishlist(item.id, item.type);
    } else {
      addToWishlist(item);
    }
  };

  const syncWithBackend = () => { if (isLoggedIn()) loadFromBackend(); };

  return (
    <WishlistContext.Provider
      value={{ items, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist, syncWithBackend }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
