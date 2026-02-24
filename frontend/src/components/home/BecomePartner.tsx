import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const BecomePartner = () => {
  return (
    <section className="py-6 bg-background">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-heritage-brown to-heritage-brown/90 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-cream-light mb-2">
                Are you a property owner?
              </h2>
              <p className="text-cream-light/80 text-sm md:text-base">
                List your property on HostHaven and start earning today
              </p>
            </div>
            <Link to="/vendor/signup">
              <Button 
                variant="gold" 
                size="lg"
                className="whitespace-nowrap"
              >
                Become a Partner
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BecomePartner;
