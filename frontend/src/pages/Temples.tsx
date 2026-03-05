import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, ChevronRight, Loader2, Search } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface Temple {
  id: string;
  name: string;
  slug: string;
  city: string;
  fullAddress: string;
  landmark?: string;
  deityName?: string;
  templeType?: string;
  images?: Array<string | { url?: string; isPrimary?: boolean }>;
}

const formatCity = (city?: string) => {
  if (!city) return "";
  return city
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const asImageUrl = (image: string | { url?: string; isPrimary?: boolean }) =>
  typeof image === "string" ? image : image?.url;

const getTempleImage = (temple: Temple) => {
  if (temple.images?.length) {
    const primary = temple.images.find((image) => typeof image !== "string" && image.isPrimary);
    const primaryUrl = primary ? asImageUrl(primary) : undefined;
    if (primaryUrl) return primaryUrl;

    const fallback = asImageUrl(temple.images[0]);
    if (fallback) return fallback;
  }

  return "https://images.unsplash.com/photo-1621427642694-46e7f7e4db14?w=800";
};

const Temples = () => {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("ALL");

  useEffect(() => {
    setIsLoading(true);
    api.temples
      .getAll({ limit: "50" })
      .then((res: any) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        setTemples(list);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const cities = useMemo(() => ["ALL", ...Array.from(new Set(temples.map((temple) => temple.city).filter(Boolean)))], [temples]);

  const filteredTemples = useMemo(() => {
    return temples.filter((temple) => {
      const cityMatch = selectedCity === "ALL" || temple.city === selectedCity;
      if (!cityMatch) return false;

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      return [temple.name, temple.deityName, temple.templeType, temple.city]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [temples, selectedCity, searchQuery]);

  return (
    <Layout>
      <div className="py-6 md:py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Sacred Temples</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Find temples by name, deity, and city.
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-card p-4 mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by temple name, deity, or city..."
                className="pl-10 h-11 bg-muted border-0 rounded-xl"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCity === city
                      ? "gradient-gold text-primary-foreground shadow-gold"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {city === "ALL" ? "All Cities" : formatCity(city)}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredTemples.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">No temples found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredTemples.map((temple) => (
                <Link
                  key={temple.id}
                  to={`/temples/${temple.slug || temple.id}`}
                  className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/40"
                >
                  <div className="relative h-52 sm:h-56 md:h-52 lg:h-56 overflow-hidden">
                    <img
                      src={getTempleImage(temple)}
                      alt={temple.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown/90 via-heritage-brown/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      {temple.templeType && (
                        <span className="inline-block px-3 py-1 bg-primary/90 text-primary-foreground text-xs font-medium rounded-full mb-2">
                          {temple.templeType}
                        </span>
                      )}
                      <h3 className="font-serif font-semibold text-xl text-cream-light leading-tight">{temple.name}</h3>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">Deity:</span> {temple.deityName || "Not specified"}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="line-clamp-1">{temple.fullAddress || temple.landmark || formatCity(temple.city)}</span>
                    </p>

                    <Button variant="goldOutline" className="w-full mt-2">
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

export default Temples;
