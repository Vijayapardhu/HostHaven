import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TempleItem } from "@/hooks/useHomepageConfig";

interface Props {
  items?: TempleItem[];
}

const fallbackImage = "https://images.unsplash.com/photo-1600100397608-f0e61afcdf7a?w=600";

const TemplesPreview = ({ items }: Props) => {
  const activeItems = items?.filter((i) => i.isActive);
  
  if (!activeItems || activeItems.length === 0) {
    return null;
  }

  const temples = activeItems.map((t) => ({
    id: t.id,
    name: t.name || "",
    location: t.location || "",
    image: t.imageUrl || fallbackImage,
    link: t.link || `/temples/${t.slug || t.id}`,
  }));

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Divine Temples
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Explore sacred temples across Andhra Pradesh</p>
          </div>
          <Link to="/temples">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {temples.map((temple, index) => (
            <Link
              key={temple.id}
              to={temple.link}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <img
                src={temple.image}
                alt={temple.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown/95 via-heritage-brown/30 to-transparent group-hover:via-heritage-brown/40 transition-all duration-500" />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500" />
              
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                <h3 className="font-serif font-bold text-lg md:text-xl text-cream-light group-hover:text-gold-light transition-colors duration-300 line-clamp-2">
                  {temple.name}
                </h3>
                <div className="flex items-center gap-1.5 text-cream-light/80 text-sm mt-1.5 mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  {temple.location}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-1 group-hover:translate-y-0">
                  <span className="bg-primary/90 text-primary-foreground text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-primary transition-all inline-flex items-center gap-1.5">
                    Learn More
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TemplesPreview;
