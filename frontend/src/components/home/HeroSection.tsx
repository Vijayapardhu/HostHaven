import { useNavigate, Link } from "react-router-dom";
import { Search, ShieldCheck, BadgeCheck, Zap, MapPin } from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();

  const trustFactors = [
    { icon: ShieldCheck, label: "Verified Properties" },
    { icon: BadgeCheck, label: "Instant Booking" },
    { icon: Zap, label: "Exclusive Discounts" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-heritage-brown via-heritage-brown to-heritage-brown/95">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1920')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-heritage-brown/80 via-heritage-brown/60 to-heritage-brown" />

      <div className="relative container mx-auto px-4 py-10 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 md:px-4 py-1 mb-6">
            <MapPin className="w-3 h-3 md:w-4 md:h-4 text-gold-light" />
            <span className="text-cream-light/90 text-xs md:text-sm font-medium">Andhra Pradesh, India</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-cream-light leading-tight mb-3 md:mb-4">
            Best Hotel Deals Across<br className="hidden sm:block" />
            <span className="text-gold-light">Andhra Pradesh</span>
          </h1>

          <p className="text-cream-light/80 text-sm md:text-lg max-w-2xl mx-auto mb-6 md:mb-8 px-2">
            Discover premium hotels, authentic homestays, and sacred temple experiences. 
            Your perfect stay awaits in the land of rich heritage.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mb-6 md:mb-10 px-2">
            {trustFactors.map((factor) => {
              const Icon = factor.icon;
              return (
                <div key={factor.label} className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gold/20 flex items-center justify-center">
                    <Icon aria-hidden="true" className="w-3 h-3 md:w-4 md:h-4 text-gold-light" />
                  </div>
                  <span className="text-cream-light/90 text-xs md:text-sm font-medium whitespace-nowrap">{factor.label}</span>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => navigate("/search?focus=1")}
            className="group relative w-full max-w-xl mx-auto rounded-xl border border-white/20 bg-white/10 backdrop-blur-md py-3 md:py-4 pl-10 md:pl-12 pr-3 md:pr-4 text-left shadow-lg hover:bg-white/20 transition-all"
          >
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 md:left-4 top-1/2 h-4 w-4 md:h-5 md:w-5 -translate-y-1/2 text-cream-light/50" />
            <span className="text-cream-light/60 text-sm md:text-base group-hover:text-cream-light/80 transition-colors line-clamp-1">Search hotels, homestays, temples, services...</span>
          </button>

          <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-center gap-2 md:gap-4 text-xs md:text-sm px-2">
            <span className="text-cream-light/60">Popular:</span>
            {["Vijayawada", "Nandyal", "Vetapalem", "Tirupati"].map((place) => (
              <Link
                key={place}
                to={`/search?q=${place}`}
                className="text-cream-light/80 hover:text-gold-light transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-gold-light/50"
              >
                {place}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
