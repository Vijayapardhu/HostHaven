import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heritageImage from "@/assets/heritage-welcome.jpg";

const HeritageBanner = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden">
          <img
            src={heritageImage}
            alt="Andhra Heritage Welcome"
            className="w-full h-[300px] md:h-[400px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-heritage-brown/90 via-heritage-brown/60 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-8 md:px-12">
              <div className="max-w-lg">
                <h2 className="text-2xl md:text-4xl font-serif font-bold text-cream-light mb-4">
                  Experience Traditional{" "}
                  <span className="text-gold-light">Andhra Hospitality</span>
                </h2>
                <p className="text-cream-light/80 mb-6 text-sm md:text-base">
                  Discover the warmth of our heritage through authentic stays, 
                  divine temple visits, and unforgettable cultural experiences.
                </p>
                <Link to="/hotels">
                  <Button variant="gold" size="lg">
                    Explore Stays
                    <ArrowRight className="w-5 h-5" />
                  </Button>
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
