import { Link } from "react-router-dom";
import { Star, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeaturedItem {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  image: string;
  type: "hotel" | "home";
}

const featuredHotels: FeaturedItem[] = [
  {
    id: "1",
    name: "Hotel Minerva Grand",
    location: "Vijayawada",
    price: 6500,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600",
    type: "hotel",
  },
  {
    id: "2",
    name: "Sri Sai Residency",
    location: "Nandyala",
    price: 3200,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600",
    type: "hotel",
  },
  {
    id: "3",
    name: "Beach View Resort",
    location: "Vetapalem",
    price: 4800,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600",
    type: "hotel",
  },
];

const featuredHomes: FeaturedItem[] = [
  {
    id: "1",
    name: "Krishna Riverside Villa",
    location: "Vijayawada",
    price: 4500,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600",
    type: "home",
  },
  {
    id: "2",
    name: "Heritage Cottage",
    location: "Nandyala",
    price: 2800,
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600",
    type: "home",
  },
  {
    id: "3",
    name: "Seaside Home",
    location: "Vetapalem",
    price: 3500,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600",
    type: "home",
  },
];

interface FeaturedCardProps {
  item: FeaturedItem;
}

const FeaturedCard = ({ item }: FeaturedCardProps) => (
  <Link
    to={`/${item.type}s/${item.id}`}
    className="group block bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
  >
    <div className="relative h-48 overflow-hidden">
      <img
        src={item.image}
        alt={item.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
        <Star className="w-4 h-4 text-primary fill-primary" />
        <span className="text-sm font-medium">{item.rating}</span>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-serif font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
        {item.name}
      </h3>
      <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
        <MapPin className="w-4 h-4" />
        {item.location}
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="font-semibold text-foreground">
          ₹{item.price.toLocaleString()}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <FeaturedCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  </section>
);

export const FeaturedHotels = () => (
  <FeaturedSection
    title="Featured Hotels"
    subtitle="Handpicked luxury stays across Andhra Pradesh"
    items={featuredHotels}
    viewAllLink="/hotels"
  />
);

export const FeaturedHomes = () => (
  <FeaturedSection
    title="Featured Homes"
    subtitle="Authentic home stays for a local experience"
    items={featuredHomes}
    viewAllLink="/homes"
  />
);

export default FeaturedSection;
