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
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  toggleWishlist: (item: WishlistItem) => void;
  syncWithBackend: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const isLoggedIn = () => !!localStorage.getItem("accessToken");

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<WishlistItem[]>([]);

  const loadFromBackend = useCallback(async () => {
    if (!isLoggedIn()) return;
    try {
      const data = await api.wishlist.getAll();
      const backendItems: WishlistItem[] = (Array.isArray(data?.data) ? data.data : []).map((w: any) => ({
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
    } catch {
      // Fallback to localStorage
      const stored = localStorage.getItem("hosthaven_wishlist");
      if (stored) try { setItems(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn()) {
      loadFromBackend();
    } else {
      const stored = localStorage.getItem("hosthaven_wishlist");
      if (stored) try { setItems(JSON.parse(stored)); } catch { localStorage.removeItem("hosthaven_wishlist"); }
    }
  }, [loadFromBackend]);

  useEffect(() => {
    localStorage.setItem("hosthaven_wishlist", JSON.stringify(items));
  }, [items]);

  const addToWishlist = async (item: WishlistItem) => {
    if (items.some((i) => i.id === item.id)) return;
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
        if (result?.id) {
          setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, wishlistId: result.id } : i));
        }
      } catch {}
    }
  };

  const removeFromWishlist = async (id: string) => {
    const item = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (isLoggedIn() && item?.wishlistId) {
      try { await api.wishlist.remove(item.wishlistId); } catch {}
    }
  };

  const isInWishlist = (id: string) => items.some((item) => item.id === id);

  const toggleWishlist = (item: WishlistItem) => {
    if (isInWishlist(item.id)) {
      removeFromWishlist(item.id);
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
