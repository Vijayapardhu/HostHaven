import { Link } from "react-router-dom";
import { Car, Bike, Wrench, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    id: "car-rental",
    name: "Car Rental",
    description: "Explore Andhra Pradesh with our reliable car rental service",
    icon: Car,
  },
  {
    id: "bike-rental",
    name: "Bike Rental",
    description: "Two-wheelers for quick and easy local travel",
    icon: Bike,
  },
  {
    id: "car-services",
    name: "Car Services",
    description: "Professional car maintenance and repair services",
    icon: Wrench,
  },
];

const ServicesPreview = () => {
  return (
    <section className="py-6 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-2xl font-serif font-bold text-foreground">
            Travel Services
          </h2>
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
                to={`/services#${service.id}`}
                className="group bg-card rounded-xl p-4 md:p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl gradient-gold flex items-center justify-center mb-3 group-hover:shadow-gold transition-shadow">
                  <Icon className="w-5 h-5 md:w-7 md:h-7 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-xs md:text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
                <p className="text-muted-foreground text-xs hidden md:block">
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