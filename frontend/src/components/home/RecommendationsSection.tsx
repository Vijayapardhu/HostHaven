import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { api } from "@/lib/api";

interface RecommendationItem {
  id: string;
  slug?: string;
  name: string;
  rating: number;
  reviewCount?: number;
  reviews?: number;
  basePrice?: number;
  price?: number;
  originalPrice?: number;
  image?: string;
  images?: Array<{ url: string }>;
}

const getImage = (item: RecommendationItem) => {
  if (item.image) return item.image;
  if (item.images && item.images.length > 0) return item.images[0].url;
  return "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600";
};

const RecommendationsSection = () => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);

  useEffect(() => {
    api.properties.getFeatured()
      .then((data: any) => {
        const all = Array.isArray(data) ? data : data?.properties || [];
        setRecommendations(all.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  if (recommendations.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Recommendations For You</h2>
            <p className="text-sm text-muted-foreground mt-1">Handpicked stays based on your preferences</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {recommendations.map((item) => {
            const price = item.price ?? item.basePrice ?? 0;
            const originalPrice = item.originalPrice ?? Math.round(price * 1.2);
            const reviews = item.reviewCount || item.reviews || 0;
            const itemRating = Math.round(item.rating || 0);
            return (
              <Link
                key={item.id}
                to={`/hotels/${item.slug || item.id}`}
                className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={getImage(item)}
                    alt={item.name}
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600"; }}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm">
                    <Star aria-hidden="true" className="w-3.5 h-3.5 text-primary fill-primary" />
                    <span className="text-xs font-bold text-foreground">{typeof item.rating === 'number' ? item.rating.toFixed(1) : Number(item.rating) || 0}</span>
                  </div>
                  {originalPrice > price && originalPrice > 0 && (
                    <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      {Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF
                    </div>
                  )}
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="font-semibold text-sm md:text-base text-foreground truncate group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex items-center" aria-label={`${itemRating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          aria-hidden="true"
                          className={`w-3 h-3 ${
                            i < itemRating
                              ? "text-primary fill-primary"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">({reviews} reviews)</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-bold text-base md:text-lg text-foreground">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    {originalPrice > price && (
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">/night</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RecommendationsSection;
