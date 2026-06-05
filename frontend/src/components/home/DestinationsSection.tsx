import { Link } from "react-router-dom";
import { MapPin, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { DestinationItem } from "@/hooks/useHomepageConfig";

interface Props {
  items?: DestinationItem[];
}

const DestinationsSection = ({ items }: Props) => {
  const activeItems = items?.filter((i) => i.isActive);
  
  if (!activeItems || activeItems.length === 0) {
    return null;
  }

  const destinations = activeItems.map((item) => ({
    id: item.id,
    name: item.name || "",
    image: item.imageUrl || "",
    link: item.link || `/hotels?destination=${item.name?.toLowerCase()}`,
    count: item.propertyCount ? `${item.propertyCount}+ Properties` : "Available Now",
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Top Destinations For You</h2>
            <p className="text-sm text-muted-foreground mt-1">Explore popular travel destinations across Andhra Pradesh</p>
          </div>
          <Link
            to="/hotels"
            className="hidden md:flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View All <ChevronRight aria-hidden="true" className="w-4 h-4" />
          </Link>
        </div>
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {destinations.map((dest, index) => (
            <motion.div
              key={dest.id}
              variants={itemVariants}
              className="relative"
            >
              <Link
                to={dest.link}
                className="group relative block rounded-xl overflow-hidden aspect-[4/5] shadow-card"
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600"; }}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown/95 via-heritage-brown/30 to-transparent group-hover:via-heritage-brown/40 transition-all duration-500" />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500" />
                
                <div className="absolute top-3 left-3">
                  <span className="bg-white/15 backdrop-blur-sm border border-white/20 text-cream-light text-[10px] font-medium px-2.5 py-1 rounded-full">
                    {dest.count}
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                  <div className="flex items-center gap-1.5 text-cream-light/70 text-xs mb-1.5">
                    <MapPin aria-hidden="true" className="w-3 h-3" />
                    <span>Andhra Pradesh</span>
                  </div>
                  <h3 className="font-serif font-bold text-lg md:text-2xl text-cream-light group-hover:text-gold-light transition-colors duration-300 mb-2">
                    {dest.name}
                  </h3>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 -translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-4 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                      Explore Destinations
                      <ChevronRight aria-hidden="true" className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default DestinationsSection;
