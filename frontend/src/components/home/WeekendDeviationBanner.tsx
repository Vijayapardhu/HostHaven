import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { BannerSlide } from "@/hooks/useHomepageConfig";

interface Props {
  slides?: BannerSlide[];
}

const fallbackImage = "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200";

const WeekendDeviationBanner = ({ slides: configSlides }: Props) => {
  const activeSlides = (configSlides || []).filter((s) => s.isActive);
  const resolvedSlides = activeSlides.map((s) => ({
    image: s.imageUrl || fallbackImage,
    title: s.title || "",
    subtitle: s.subtitle || "",
    tags: s.tags || "",
    link: s.ctaLink || "/hotels",
    cta: s.ctaText || "Learn More",
  }));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (resolvedSlides.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % resolvedSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [resolvedSlides.length, isPaused]);

  const current = resolvedSlides[currentIndex];

  if (!resolvedSlides.length || !current) return null;

  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        <div
          className="relative rounded-2xl overflow-hidden h-[220px] md:h-[360px] shadow-xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured destinations"
        >
          {resolvedSlides.map((slide, index) => (
            <img
              key={index}
              src={slide.image}
              alt=""
              role="presentation"
              loading={index === 0 ? "eager" : "lazy"}
              onError={(e) => { (e.target as HTMLImageElement).src = fallbackImage; }}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          
          <div className="absolute inset-0 bg-gradient-to-r from-heritage-brown/90 via-heritage-brown/50 to-transparent" />
          
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12">
            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-cream-light/80 text-xs font-medium w-fit mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-light" aria-hidden="true" />
              Featured Destination
            </span>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif font-bold text-cream-light leading-tight mb-3 whitespace-pre-line">
              {current.title}
            </h2>
            <p className="text-cream-light/80 text-sm md:text-lg mb-2 max-w-xl">
              {current.subtitle}
            </p>
            <p className="text-cream-light/60 text-xs md:text-sm mb-6 max-w-lg">
              {current.tags}
            </p>
            <Link
              to={current.link}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-gold text-white rounded-xl px-5 py-2.5 md:px-6 md:py-3 text-sm md:text-base font-semibold w-fit hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              {current.cta}
              <ArrowRight aria-hidden="true" className="w-4 h-4" />
            </Link>
          </div>

          {resolvedSlides.length > 1 && (
            <div className="absolute bottom-4 right-6 flex gap-2" role="tablist" aria-label="Slide navigation">
              {resolvedSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  role="tab"
                  aria-selected={index === currentIndex}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex ? "bg-gold-light w-8" : "bg-cream-light/30 w-2 hover:bg-cream-light/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default WeekendDeviationBanner;
