import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface FeaturedItem {
  id: string;
  name: string;
  location?: string;
  city?: string;
  price?: number;
  basePrice?: number;
  rating: number;
  image?: string;
  images?: Array<{ url: string }>;
  type: "hotel" | "home" | "HOTEL" | "HOME";
}

interface FeaturedCardProps {
  item: FeaturedItem;
}

const getItemImage = (item: FeaturedItem) => {
  if (item.image) return item.image;
  if (item.images?.length) return item.images[0].url;
  return "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600";
};

const getItemType = (item: FeaturedItem) => {
  const t = item.type?.toLowerCase();
  return t === "home" ? "home" : "hotel";
};

const FeaturedCard = ({ item }: FeaturedCardProps) => (
  <Link
    to={`/${getItemType(item)}s/${item.id}`}
    className="group block bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
  >
    <div className="relative h-48 overflow-hidden">
      <img
        src={getItemImage(item)}
        alt={item.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
        <Star className="w-4 h-4 text-primary fill-primary" />
        <span className="text-sm font-medium">{item.rating || 0}</span>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-serif font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
        {item.name}
      </h3>
      <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
        <MapPin className="w-4 h-4" />
        {item.city || item.location || ""}
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="font-semibold text-foreground">
          ₹{(item.basePrice || item.price || 0).toLocaleString()}
          <span className="text-muted-foreground font-normal text-sm">/night</span>
        </p>
        <Button variant="goldOutline" size="sm">
          Book
        </Button>
      </div>
    </div>
  </Link>
);

interface FeaturedSectionProps {
  title: string;
  subtitle: string;
  items: FeaturedItem[];
  viewAllLink: string;
}

const FeaturedSection = ({ title, subtitle, items, viewAllLink }: FeaturedSectionProps) => (
  <section className="py-12">
    <div className="container mx-auto px-4">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
            {title}
          </h2>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <Link to={viewAllLink}>
          <Button variant="ghost" className="text-primary hover:text-primary/80">
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <FeaturedCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">No featured properties available yet.</p>
      )}
    </div>
  </section>
);

export const FeaturedHotels = () => {
  const [items, setItems] = useState<FeaturedItem[]>([]);

  useEffect(() => {
    api.properties.getFeatured()
      .then((data: any) => {
        const all = Array.isArray(data) ? data : data?.properties || [];
        setItems(all.filter((p: any) => p.type?.toUpperCase() === "HOTEL").slice(0, 6));
      })
      .catch(() => {});
  }, []);

  return (
    <FeaturedSection
      title="Featured Hotels"
      subtitle="Handpicked luxury stays across Andhra Pradesh"
      items={items}
      viewAllLink="/hotels"
    />
  );
};

export const FeaturedHomes = () => {
  const [items, setItems] = useState<FeaturedItem[]>([]);

  useEffect(() => {
    api.properties.getFeatured()
      .then((data: any) => {
        const all = Array.isArray(data) ? data : data?.properties || [];
        setItems(all.filter((p: any) => p.type?.toUpperCase() === "HOME").slice(0, 6));
      })
      .catch(() => {});
  }, []);

  return (
    <FeaturedSection
      title="Featured Homestays"
      subtitle="Authentic homestays for a local experience"
      items={items}
      viewAllLink="/homes"
    />
  );
};

export default FeaturedSection;
