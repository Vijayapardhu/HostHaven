import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/hooks/useHomepageConfig";

interface PromoBannerProps {
  config?: HomepageConfig | null;
}

const PromoBanner = ({ config }: PromoBannerProps) => {
  const banner = config?.promoBanner;
  const sectionConfig = config?.sections?.promoBanner;
  
  if (!banner?.imageUrl) return null;
  
  if (sectionConfig?.isVisible === false) return null;

  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        <Link 
          to={banner.link || "/"} 
          className="group block rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="relative">
            <img 
              src={banner.imageUrl} 
              alt={banner.title || "Promo"} 
              className="w-full h-[200px] md:h-[320px] object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {banner.title && (
              <div className="absolute inset-0 bg-gradient-to-r from-heritage-brown/60 to-transparent flex items-center">
                <div className="p-6 md:p-10">
                  <h3 className="text-xl md:text-3xl font-serif font-bold text-cream-light mb-2">{banner.title}</h3>
                </div>
              </div>
            )}
          </div>
        </Link>
      </div>
    </section>
  );
};

export default PromoBanner;
