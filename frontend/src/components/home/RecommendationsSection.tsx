import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecommendationItem {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice: number;
  image: string;
}

const recommendations: RecommendationItem[] = [
  {
    id: "1",
    name: "Hotel 1",
    rating: 4,
    reviews: 502,
    price: 1999,
    originalPrice: 2499,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600",
  },
  {
    id: "2",
    name: "Hotel 2",
    rating: 4,
    reviews: 502,
    price: 1999,
    originalPrice: 2499,
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600",
  },
  {
    id: "3",
    name: "Hotel 3",
    rating: 4,
    reviews: 502,
    price: 1999,
    originalPrice: 2499,
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600",
  },
];

const RecommendationsSection = () => {
  return (
    <section className="py-6 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-lg md:text-2xl font-serif font-bold text-foreground mb-4">
          Recommendations For You
        </h2>

        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {recommendations.map((item) => (
            <Link
              key={item.id}
              to={`/hotels/${item.id}`}
              className="group bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={item.image}
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
                        i < item.rating
                          ? "text-primary fill-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground">({item.reviews})</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-bold text-sm md:text-base text-foreground">
                    ₹{item.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground line-through">
                    ({item.originalPrice.toLocaleString()})
                  </span>
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecommendationsSection;
