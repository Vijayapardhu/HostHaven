import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface RecommendationItem {
  id: string;
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
    <section className="py-6 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-lg md:text-2xl font-serif font-bold text-foreground mb-4">
          Recommendations For You
        </h2>

        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {recommendations.map((item) => {
            const price = item.basePrice || item.price || 0;
            const reviews = item.reviewCount || item.reviews || 0;
            return (
              <Link
                key={item.id}
                to={`/hotels/${item.id}`}
                className="group bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={getImage(item)}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-2 md:p-4">
                  <h3 className="font-semibold text-sm md:text-base text-foreground truncate">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.round(item.rating || 0)
                            ? "text-primary fill-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground">({reviews})</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-bold text-sm md:text-base text-foreground">
                      ₹{price.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">/night</span>
                  </div>
                  <Button 
                    variant="goldOutline" 
                    size="sm" 
                    className="w-full mt-2 text-xs md:text-sm h-8"
                  >
                    View Details
                  </Button>
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
