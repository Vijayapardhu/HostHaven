import { Link } from "react-router-dom";
import { Car, Bike, Wrench, ArrowRight, Star, Heart, Clock, Settings2, RefreshCcw, ShieldCheck, Map, Home, Building, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ServiceCardItem } from "@/hooks/useHomepageConfig";

const iconMap: Record<string, React.ElementType> = {
  car: Car, bike: Bike, wrench: Wrench, star: Star, heart: Heart, clock: Clock,
  settings: Settings2, refresh: RefreshCcw, shield: ShieldCheck, map: Map,
  home: Home, building: Building, phone: Phone, mail: Mail, zap: ArrowRight,
};

interface Props {
  items?: ServiceCardItem[];
}

const ServicesPreview = ({ items }: Props) => {
  const activeItems = items?.filter((i) => i.isActive);
  
  if (!activeItems || activeItems.length === 0) {
    return null;
  }

  const services = activeItems.map((s) => ({
    id: s.id,
    name: s.title,
    description: s.description,
    icon: iconMap[s.icon] || Car,
    link: s.link || `/services#${s.id}`,
  }));

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Travel Services
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Convenient travel services for your journey</p>
          </div>
          <Link to="/services">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.id}
                to={service.link}
                className="group bg-card rounded-2xl p-5 md:p-7 shadow-card border border-border/50 hover:shadow-card-hover hover:-translate-y-1 hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary to-gold flex items-center justify-center mb-4 group-hover:shadow-gold transition-all duration-300 group-hover:scale-110">
                  <Icon className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-base md:text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {service.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesPreview;
