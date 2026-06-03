import { useState } from "react";
import { Tag, Copy, Check, Gift, Percent, Star, ArrowRight } from "lucide-react";

interface Offer {
  code: string;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  color: string;
}

const offers: Offer[] = [
  {
    code: "WELCOME50",
    title: "First Booking Offer",
    description: "Get 50% off on your first hotel booking with HostHaven",
    discount: "50% OFF",
    validUntil: "Valid until Jun 30",
    color: "from-primary to-gold",
  },
  {
    code: "STAY3PAY2",
    title: "Extended Stay Deal",
    description: "Book 3 nights and pay for only 2 across all properties",
    discount: "1 NIGHT FREE",
    validUntil: "Valid until Jul 15",
    color: "from-green-500 to-emerald-600",
  },
  {
    code: "TEMPLE10",
    title: "Temple Town Special",
    description: "Extra 10% off on temple town properties in Tirupati & Vijayawada",
    discount: "10% EXTRA",
    validUntil: "Valid until Aug 31",
    color: "from-purple-500 to-purple-700",
  },
];

const OfferCard = ({ offer }: { offer: Offer }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-card rounded-xl border border-border/60 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      <div className={`h-2 bg-gradient-to-r ${offer.color}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm text-foreground mb-1">{offer.title}</h3>
            <p className="text-xs text-muted-foreground">{offer.description}</p>
          </div>
          <div className={`bg-gradient-to-r ${offer.color} text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap`}>
            {offer.discount}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/50 mt-3">
          <div className="flex items-center gap-2">
            <div className="bg-muted rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-primary" />
              <code className="text-sm font-bold text-foreground tracking-wider">{offer.code}</code>
            </div>
            <button
              onClick={() => handleCopy(offer.code)}
              className="w-7 h-7 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground">{offer.validUntil}</span>
        </div>
      </div>
    </div>
  );
};

const OffersSection = () => {
  return (
    <section id="offers" className="py-8 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Offers & Deals</h2>
            </div>
            <p className="text-sm text-muted-foreground">Exclusive discounts and promo codes for your stay</p>
          </div>
          <button className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            View All Offers
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <OfferCard key={offer.code} offer={offer} />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-green-500" />
            Best price guaranteed
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            Member exclusive deals
          </div>
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-primary" />
            No hidden charges
          </div>
        </div>
      </div>
    </section>
  );
};

export default OffersSection;
