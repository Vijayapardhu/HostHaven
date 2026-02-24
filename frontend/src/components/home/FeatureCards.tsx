import { Link } from "react-router-dom";
import { Clock, Settings2, RefreshCcw, Zap, ShieldCheck } from "lucide-react";

const FeatureCards = () => {
  return (
    <section className="py-6 md:py-8 bg-cream-light">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {/* 24 Hour Check-In */}
          <div className="bg-card rounded-xl p-4 md:p-6 shadow-card border-2 border-primary/20 flex flex-col items-center text-center hover:shadow-card-hover hover:border-primary/40 transition-all">
            <div className="relative">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-saffron/20 flex items-center justify-center mb-3 md:mb-4">
                <Clock className="w-6 h-6 md:w-7 md:h-7 text-saffron" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
            <h3 className="font-semibold text-sm md:text-base text-foreground mb-1">24 Hour Check-In</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-snug">
              Instant access to your stay, anytime
            </p>
            <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              Fast Resolution
            </div>
          </div>

          {/* Customizable Rooms */}
          <Link 
            to="/contact"
            className="bg-card rounded-xl p-4 md:p-6 shadow-card border-2 border-primary/20 flex flex-col items-center text-center hover:shadow-card-hover hover:border-primary/40 transition-all"
          >
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/20 flex items-center justify-center mb-3 md:mb-4">
              <Settings2 className="w-6 h-6 md:w-7 md:h-7 text-primary" />
            </div>
            <h3 className="font-semibold text-sm md:text-base text-foreground mb-1">Customizable Rooms</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-snug">
              Tailor your stay to your needs
            </p>
          </Link>

          {/* Instant Refund */}
          <div className="bg-card rounded-xl p-4 md:p-6 shadow-card border-2 border-primary/20 flex flex-col items-center text-center hover:shadow-card-hover hover:border-primary/40 transition-all">
            <div className="relative">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-saffron/20 flex items-center justify-center mb-3 md:mb-4">
                <RefreshCcw className="w-6 h-6 md:w-7 md:h-7 text-saffron" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
            <h3 className="font-semibold text-sm md:text-base text-foreground mb-1">Instant Refund</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-snug">
              Fast and hassle-free refunds
            </p>
            <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />
              59 Second Response
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
