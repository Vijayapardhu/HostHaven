import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, ChevronRight, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface DeviationTemple {
  id: string;
  name: string;
  slug?: string;
  location?: string;
  city?: string;
  tagline?: string;
  shortDesc?: string;
  image?: string;
  images?: Array<{ url: string }>;
}

const getTempleImage = (temple: DeviationTemple) => {
  if (temple.image) return temple.image;
  if (temple.images && temple.images.length > 0) return temple.images[0].url;
  return "https://images.unsplash.com/photo-1621427642694-46e7f7e4db14?w=800";
};

const DeviationTemples = () => {
  const [temples, setTemples] = useState<DeviationTemple[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.temples.getAll({ limit: "12" })
      .then((res: any) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        setTemples(list.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground">
              Weekend Deviation Temples
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm">
              Explore sacred heritage sites perfect for a weekend spiritual getaway across Andhra Pradesh
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : temples.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">No temples found.</p>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {temples.map((temple) => (
              <Link
                key={temple.id}
                to={`/temples/${temple.slug || temple.id}`}
                className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getTempleImage(temple)}
                    alt={temple.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    {(temple.tagline || temple.shortDesc) && (
                      <p className="text-gold-light text-xs font-medium mb-1">{temple.tagline || temple.shortDesc}</p>
                    )}
                    <h3 className="font-serif font-semibold text-lg text-cream-light">
                      {temple.name}
                    </h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    {temple.location || temple.city || ""}
                  </div>
                  <Button variant="goldOutline" size="sm" className="w-full">
                    View Details
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DeviationTemples;
