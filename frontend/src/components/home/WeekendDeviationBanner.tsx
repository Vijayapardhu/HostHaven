import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import bannerHotel from "@/assets/banner-hotel.jpg";
import bannerHome from "@/assets/banner-home.jpg";
import templeBanner from "@/assets/temple-banner-1.jpg";
import type { BannerSlide } from "@/hooks/useHomepageConfig";

const defaultSlides = [
  {
    image: bannerHotel,
    title: "Planning a Weekend\nGetaway?",
    subtitle: "Discover Premium Hotels",
    tags: "· Luxury · Comfort · Service",
    link: "/hotels",
    cta: "Explore Hotels",
  },
  {
    image: bannerHome,
    title: "Looking for a\nCozy Stay?",
    subtitle: "Find Perfect Homes",
    tags: "· Spacious · Homely · Affordable",
    link: "/homes",
    cta: "Browse Homes",
  },
  {
    image: templeBanner,
    title: "Planning a Weekend\nDeviation?",
    subtitle: "Discover Sacred Temples",
    tags: "· Yaganti · Mahanandi · Ahobilam",
    link: "/deviation-temples",
    cta: "Know the route",
  },
];

const localImages: Record<string, string> = {
  "": "",
  "banner-hotel": bannerHotel,
  "banner-home": bannerHome,
  "temple-banner": templeBanner,
};

interface Props {
  slides?: BannerSlide[];
}

const WeekendDeviationBanner = ({ slides: configSlides }: Props) => {
  const activeSlides = configSlides?.filter((s) => s.isActive);
  const useConfigSlides = activeSlides && activeSlides.length > 0;

  const resolvedSlides = useConfigSlides
    ? activeSlides.map((s, i) => ({
        image: s.imageUrl || defaultSlides[i]?.image || bannerHotel,
        title: s.title || defaultSlides[i]?.title || "",
        subtitle: s.subtitle || defaultSlides[i]?.subtitle || "",
        tags: s.tags || defaultSlides[i]?.tags || "",
        link: s.ctaLink || defaultSlides[i]?.link || "/hotels",
        cta: s.ctaText || defaultSlides[i]?.cta || "Learn More",
      }))
    : defaultSlides;

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % resolvedSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [resolvedSlides.length]);

  const current = resolvedSlides[currentIndex];

  return (
    <section className="py-4 md:py-5">
      <div className="container mx-auto px-4">
        <div className="relative rounded-2xl overflow-hidden h-[220px] md:h-[340px] lg:h-[380px]">
          {resolvedSlides.map((slide, index) => (
            <img
              key={index}
              src={slide.image}
              alt={slide.subtitle}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          
          <div className="absolute inset-0 bg-gradient-to-r from-heritage-brown/80 via-heritage-brown/50 to-transparent" />
          
          <div className="absolute inset-0 flex flex-col justify-center px-5 md:px-8 lg:px-10">
            <h2 className="text-xl md:text-3xl lg:text-4xl font-serif font-bold text-cream-light leading-tight mb-2 whitespace-pre-line">
              {current.title}
            </h2>
            <p className="text-cream-light/80 text-sm md:text-base mb-1">
              {current.subtitle}
            </p>
            <p className="text-cream-light/70 text-xs md:text-sm mb-4">
              {current.tags}
            </p>
            <Link
              to={current.link}
              className="inline-flex items-center gap-2 bg-cream-light/20 backdrop-blur-sm border border-cream-light/30 rounded-lg px-4 py-2 md:px-5 md:py-2.5 text-cream-light text-sm md:text-base font-medium w-fit hover:bg-cream-light/30 transition-colors"
            >
              {current.cta}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {resolvedSlides.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex ? "bg-cream-light w-4" : "bg-cream-light/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeekendDeviationBanner;
