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
      .catch(() => { })
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Sacred Temples
            </h1>
            <p className="text-muted-foreground mt-2">
              Find temples by name, deity, and city.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-2xl shadow-card p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search temples..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-muted border-0 rounded-xl"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCity === city
                      ? "gradient-gold text-primary-foreground shadow-gold"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                  >
                    {city === "ALL" ? "All Cities" : formatCity(city)}
                  </button>
                ))}
              </div>
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
                  className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={getTempleImage(temple)}
                      alt={temple.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {temple.templeType && (
                      <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center">
                        <span className="text-sm font-medium text-foreground">{temple.templeType}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-serif font-semibold text-xl text-foreground group-hover:text-primary transition-colors">
                      {temple.name}
                    </h3>

                    <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {temple.fullAddress || temple.landmark || formatCity(temple.city)}
                      </span>
                    </div>

                    <div className="mt-3 text-sm text-muted-foreground flex items-center gap-1">
                      <span className="font-medium text-foreground">Deity:</span>
                      {temple.deityName || "Not specified"}
                    </div>

                    <div className="flex items-center justify-end mt-4 pt-4 border-t border-border">
                      <Button variant="gold" size="sm">
                        View Details
                      </Button>
                    </div>
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
