import { Link } from "react-router-dom";
import { Clock, Settings2, RefreshCcw, Zap, ShieldCheck, Star, Heart, Car, Bike, Wrench, Map, Home, Building, Phone, Mail } from "lucide-react";
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
  
  if (!activeItems || activeItems.length === 0) {
    return null;
  }

  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Why Book With Us</h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">Experience the best hospitality and service across Andhra Pradesh</p>
        </div>
        <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:mx-auto scrollbar-hide">
          {activeItems.map((card) => {
            const Icon = iconMap[card.icon] || Star;
            const content = (
              <>
                <div className="relative mb-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon aria-hidden="true" className="w-5 h-5 md:w-7 md:h-7 text-primary" />
                  </div>
                  {card.badge && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-glow">
                      <Zap aria-hidden="true" className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-sm md:text-base text-foreground mb-1.5 md:mb-2 leading-tight">{card.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                {card.badge && (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-3 py-1 rounded-full">
                    <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5" />
                    {card.badge}
                  </div>
                )}
              </>
            );
            const className = "group bg-card rounded-2xl p-5 md:p-8 shadow-card border border-border/50 flex flex-col items-center justify-center text-center hover:shadow-card-hover hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 min-w-[180px] md:min-h-[240px] md:min-w-0 flex-1 md:flex-none";
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
};

export default FeatureCards;
