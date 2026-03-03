import { Link } from "react-router-dom";
import { Clock, Settings2, RefreshCcw, Zap, ShieldCheck, Star, Heart, Car, Bike, Wrench, Map, Home, Building, Phone, Mail, ChevronRight } from "lucide-react";
import type { FeatureCardItem } from "@/hooks/useHomepageConfig";

const iconMap: Record<string, React.ElementType> = {
  clock: Clock, settings: Settings2, refresh: RefreshCcw, zap: Zap, shield: ShieldCheck,
  star: Star, heart: Heart, car: Car, bike: Bike, wrench: Wrench, map: Map, home: Home,
  building: Building, phone: Phone, mail: Mail,
};

interface Props {
  items?: FeatureCardItem[];
}

const FeatureCards = ({ items }: Props) => {
  const activeItems = items?.filter((i) => i.isActive);
  const useConfig = activeItems && activeItems.length > 0;

  if (useConfig) {
    return (
      <section className="py-6 md:py-8 bg-cream-light">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {activeItems.map((card) => {
              const Icon = iconMap[card.icon] || Star;
              const content = (
                <>
                  <div className="relative">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-saffron/20 flex items-center justify-center mb-3 md:mb-4">
                      <Icon className="w-6 h-6 md:w-7 md:h-7 text-saffron" />
                    </div>
                    {card.badge && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Zap className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm md:text-base text-foreground mb-1">{card.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-snug">{card.description}</p>
                  {card.badge && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      {card.badge}
                    </div>
                  )}
                </>
              );
              const className = "bg-card rounded-xl p-4 md:p-6 shadow-card border-2 border-primary/20 flex flex-col items-center text-center hover:shadow-card-hover hover:border-primary/40 transition-all";
              return card.link ? (
                <Link key={card.id} to={card.link} className={className}>{content}</Link>
              ) : (
                <div key={card.id} className={className}>{content}</div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Default single-line feature cards with combined badges
  return (
    <section className="py-6 md:py-8 bg-cream-light">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-6 max-w-5xl mx-auto">
          {/* 24 Hour Check-In */}
          <Link 
            to="/contact"
            className="flex-1 bg-card rounded-xl p-5 md:p-6 shadow-card border-2 border-primary/20 flex items-center gap-4 hover:shadow-card-hover hover:border-primary/40 transition-all group"
          >
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-saffron/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-saffron" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">24 Hour Check-In • Fast Resolution • Customizable Rooms</h3>
              <p className="text-sm text-muted-foreground">Instant access to your stay, anytime • Tailor your stay to your needs</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </Link>

          {/* Instant Refund */}
          <Link 
            to="/contact"
            className="flex-1 bg-card rounded-xl p-5 md:p-6 shadow-card border-2 border-primary/20 flex items-center gap-4 hover:shadow-card-hover hover:border-primary/40 transition-all group"
          >
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-saffron/20 flex items-center justify-center">
                <RefreshCcw className="w-6 h-6 text-saffron" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">Instant Refund • 59 Second Response</h3>
              <p className="text-sm text-muted-foreground">Fast and hassle-free refunds</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
