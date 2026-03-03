import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/hooks/useHomepageConfig";

interface PromoBannerProps {
  config?: HomepageConfig | null;
}

const PromoBanner = ({ config }: PromoBannerProps) => {
  const banner = config?.promoBanner;
  if (!banner?.imageUrl) return null;

  return (
    <section className="py-4">
      <div className="container mx-auto px-4">
        <Link 
          to={banner.link || "/"} 
          className="block rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
        >
          <img 
            src={banner.imageUrl} 
            alt={banner.title || "Promo"} 
            className="w-full h-auto object-cover max-h-48"
          />
        </Link>
      </div>
    </section>
  );
};

export default PromoBanner;
