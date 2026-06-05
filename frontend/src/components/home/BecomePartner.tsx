import { ArrowRight } from "lucide-react";

interface PartnerConfig {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

interface Props {
  config?: PartnerConfig;
}

const BecomePartner = ({ config }: Props) => {
  if (!config || (!config.title && !config.subtitle)) {
    return null;
  }

  const title = config?.title || "";
  const subtitle = config?.subtitle || "";
  const ctaText = config?.ctaText || "Become a Partner";
  const ctaLink = config?.ctaLink || "https://vendor.hosthaven.in";

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="relative bg-gradient-to-r from-heritage-brown via-heritage-brown/95 to-heritage-brown rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200')] bg-cover bg-center opacity-10" />
          <div className="relative p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-xl">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-cream-light mb-3">
                  {title}
                </h2>
                <p className="text-cream-light/80 text-sm md:text-base leading-relaxed">
                  {subtitle}
                </p>
              </div>
              <a href={ctaLink} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto flex-shrink-0 inline-flex items-center justify-center h-12 rounded-xl px-8 bg-gradient-to-r from-gold to-gold-dark text-heritage-brown hover:from-gold-dark hover:to-gold font-semibold shadow-lg shadow-gold/30 text-sm transition-all duration-200">
                {ctaText}
                <ArrowRight aria-hidden="true" className="w-4 h-4 ml-2" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BecomePartner;
