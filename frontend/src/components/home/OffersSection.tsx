import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Tag, Copy, Check, Gift, Percent, Star, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

interface Offer {
  code: string;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  color: string;
}

const CARD_COLORS = [
  "from-primary to-gold",
  "from-green-500 to-emerald-600",
  "from-purple-500 to-purple-700",
  "from-amber-500 to-orange-600",
  "from-sky-500 to-blue-600",
  "from-rose-500 to-pink-600",
];

const titleCase = (code: string) =>
  code.replace(/[_-]+/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());

const OfferCard = ({ offer }: { offer: Offer }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      const input = document.createElement("input");
      input.value = code;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
    }
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
              <Tag aria-hidden="true" className="w-3.5 h-3.5 text-primary" />
              <code className="text-sm font-bold text-foreground tracking-wider">{offer.code}</code>
            </div>
            <button
              onClick={() => handleCopy(offer.code)}
              aria-label={copied ? "Copied" : "Copy promo code"}
              className="w-7 h-7 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center"
            >
              {copied ? <Check aria-hidden="true" className="w-3.5 h-3.5" /> : <Copy aria-hidden="true" className="w-3.5 h-3.5" />}
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground">{offer.validUntil}</span>
        </div>
      </div>
    </div>
  );
};

const OffersSection = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.coupons
      .listPublic()
      .then((coupons) => {
        if (cancelled) return;
        const mapped: Offer[] = (coupons || []).map((c, i) => {
          const discount =
            c.discountType === "PERCENTAGE"
              ? `${c.discountValue}% OFF`
              : `₹${c.discountValue} OFF`;
          const cityNote =
            c.applicableCities && c.applicableCities.length > 0
              ? ` in ${c.applicableCities.map(titleCase).join(", ")}`
              : "";
          return {
            code: c.code,
            title: titleCase(c.code),
            description:
              c.description ||
              `Save${cityNote} on your next booking${
                c.minBookingAmount ? ` above ₹${c.minBookingAmount}` : ""
              }.`,
            discount,
            validUntil: `Valid until ${new Date(c.validUntil).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}`,
            color: CARD_COLORS[i % CARD_COLORS.length],
          };
        });
        setOffers(mapped);
      })
      .catch(() => {
        if (!cancelled) setOffers([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide the section entirely when there are no live offers.
  if (!isLoading && offers.length === 0) return null;

  return (
    <section id="offers" className="py-8 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gift aria-hidden="true" className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Offers & Deals</h2>
            </div>
            <p className="text-sm text-muted-foreground">Exclusive discounts and promo codes for your stay</p>
          </div>
          <Link to="/#offers" className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            View All Offers
            <ArrowRight aria-hidden="true" className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
              ))
            : offers.map((offer) => <OfferCard key={offer.code} offer={offer} />)}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Percent aria-hidden="true" className="w-3.5 h-3.5 text-green-500" />
            Best price guaranteed
          </div>
          <div className="flex items-center gap-1.5">
            <Star aria-hidden="true" className="w-3.5 h-3.5 text-gold" />
            Member exclusive deals
          </div>
          <div className="flex items-center gap-1.5">
            <Tag aria-hidden="true" className="w-3.5 h-3.5 text-primary" />
            No hidden charges
          </div>
        </div>
      </div>
    </section>
  );
};

export default OffersSection;
