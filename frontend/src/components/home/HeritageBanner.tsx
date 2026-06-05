import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import heritageImage from "@/assets/heritage-welcome.jpg";

interface HeritageBannerConfig {
  title?: string;
  highlightText?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  image?: string;
}

interface HeritageBannerProps {
  config?: HeritageBannerConfig;
}

const HeritageBanner = ({ config }: HeritageBannerProps) => {
  const title = config?.title || "Experience Traditional";
  const highlight = config?.highlightText || "Andhra Hospitality";
  const subtitle = config?.subtitle || "Discover the warmth of our heritage through authentic stays, divine temple visits, and unforgettable cultural experiences.";
  const ctaText = config?.ctaText || "Explore Stays";
  const ctaLink = config?.ctaLink || "/hotels";
  const image = config?.image || heritageImage;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden">
          <img
            src={image}
            alt="Andhra Heritage Welcome"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = heritageImage; }}
            className="w-full h-[300px] md:h-[400px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-heritage-brown/90 via-heritage-brown/60 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-8 md:px-12">
              <div className="max-w-lg">
                <h2 className="text-2xl md:text-4xl font-serif font-bold text-cream-light mb-4">
                  {title}{" "}
                  <span className="text-gold-light">{highlight}</span>
                </h2>
                <p className="text-cream-light/80 mb-6 text-sm md:text-base">
                  {subtitle}
                </p>
                <Link to={ctaLink} className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-heritage-brown hover:from-gold-dark hover:to-gold font-semibold shadow-lg shadow-gold/30 text-sm transition-all duration-200">
                  {ctaText}
                  <ArrowRight aria-hidden="true" className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeritageBanner;
