import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Search, Hotel, Home, Landmark, Wrench, MapPin, Star, Loader2, X } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { handleError } from "@/lib/errorHandler";

type SearchCategory = "all" | "hotels" | "homes" | "temples" | "services";

interface SearchResult {
  type: SearchCategory;
  id: string;
  slug?: string;
  name: string;
  location: string;
  image: string;
  rating?: number;
  price?: number;
}

const categoryConfig = {
  all: { label: "All", icon: Search },
  hotels: { label: "Hotels", icon: Hotel },
  homes: { label: "Homestays", icon: Home },
  temples: { label: "Temples", icon: Landmark },
  services: { label: "Services", icon: Wrench },
};

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = (searchParams.get("category") as SearchCategory) || "all";

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<SearchCategory>(initialCategory);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = async (searchQuery: string, searchCategory: SearchCategory) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const searches: Promise<any>[] = [];
      const categories: SearchCategory[] = searchCategory === "all" 
        ? ["hotels", "homes", "temples", "services"] 
        : [searchCategory];

      for (const cat of categories) {
        if (cat === "hotels") {
          searches.push(
            api.properties.search({ search: searchQuery, limit: "10" }).then(res => 
              (res.data || []).map((p: any) => ({
                type: "hotels" as SearchCategory,
                id: p.id,
                slug: p.slug,
                name: p.name,
                location: p.city || p.address?.city || "",
                image: p.images?.[0]?.url || "",
                rating: p.rating,
                price: p.pricePerNight,
              }))
            ).catch(() => [])
          );
        } else if (cat === "homes") {
          searches.push(
            api.properties.search({ search: searchQuery, type: "HOME", limit: "10" }).then(res =>
              (res.data || []).map((p: any) => ({
                type: "homes" as SearchCategory,
                id: p.id,
                slug: p.slug,
                name: p.name,
                location: p.city || p.address?.city || "",
                image: p.images?.[0]?.url || "",
                rating: p.rating,
                price: p.pricePerNight,
              }))
            ).catch(() => [])
          );
        } else if (cat === "temples") {
          searches.push(
            api.temples.getAll({ search: searchQuery, limit: "10" }).then(res =>
              (res.data || []).map((t: any) => ({
                type: "temples" as SearchCategory,
                id: t.id,
                slug: t.slug,
                name: t.name,
                location: t.location || t.city || "",
                image: t.images?.[0]?.url || "",
              }))
            ).catch(() => [])
          );
        } else if (cat === "services") {
          searches.push(
            api.services.getAll({ search: searchQuery, limit: "10" }).then(res =>
              (res.data || []).map((s: any) => ({
                type: "services" as SearchCategory,
                id: s.id,
                name: s.name,
                location: s.location || s.city || "",
                image: s.images?.[0]?.url || "",
                price: s.price,
              }))
            ).catch(() => [])
          );
        }
      }

      const resultsArrays = await Promise.all(searches);
      const combinedResults = resultsArrays.flat();
      
      setResults(combinedResults);
    } catch (error) {
      handleError(error, 'api');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query, category });
    performSearch(query, category);
  };

  const handleCategoryChange = (cat: SearchCategory) => {
    setCategory(cat);
    if (query.trim()) {
      setSearchParams({ q: query, category: cat });
      performSearch(query, cat);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setSearchParams({});
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, initialCategory);
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("focus") === "1") {
      const timeout = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
      return () => window.clearTimeout(timeout);
    }
  }, [searchParams]);

  const getLink = (result: SearchResult) => {
    switch (result.type) {
      case "hotels": return `/hotels/${result.slug || result.id}`;
      case "homes": return `/homes/${result.slug || result.id}`;
      case "temples": return `/temples/${result.slug || result.id}`;
      case "services": return `/services/${result.id}`;
      default: return "/";
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
        {/* Search Header */}
        <div className="bg-card border-b border-border shadow-sm sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search hotels, homestays, temples, services..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 h-12 text-lg border-2 focus:border-primary"
                  autoComplete="off"
                  aria-label="Search"
                />
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <Button type="submit" size="lg" className="h-12 px-8">
                Search
              </Button>
            </form>

            {/* Category Tabs */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {Object.entries(categoryConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() => handleCategoryChange(key as SearchCategory)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors text-ellipsis ${
                      category === key
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : hasSearched ? (
            <>
              <p className="text-muted-foreground mb-6">
                {results.length} results for "{query}"
              </p>
              
              {results.length === 0 ? (
                <div className="text-center py-16">
                  <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground/80 mb-2">No results found</h3>
                  <p className="text-muted-foreground">Try different keywords or browse categories</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.map((result) => (
                    <Link
                      key={`${result.type}-${result.id}`}
                      to={getLink(result)}
                      className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-video relative bg-muted">
                        {result.image ? (
                          <img
                            src={result.image}
                            alt={result.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {result.type === "hotels" && <Hotel className="w-12 h-12 text-muted-foreground/30" />}
                            {result.type === "homes" && <Home className="w-12 h-12 text-muted-foreground/30" />}
                            {result.type === "temples" && <Landmark className="w-12 h-12 text-muted-foreground/30" />}
                            {result.type === "services" && <Wrench className="w-12 h-12 text-muted-foreground/30" />}
                          </div>
                        )}
                        <span className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-full text-xs font-medium">
                          {categoryConfig[result.type].label}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-1">
                          {result.name}
                        </h3>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                          <MapPin className="w-4 h-4" />
                          {result.location || "Location not available"}
                        </div>
                        <div className="flex items-center justify-between">
                          {result.rating && (
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="font-medium">{result.rating ? Number(result.rating).toFixed(1) : '-'}</span>
                            </div>
                          )}
                          {result.price != null && (
                            <div className="text-primary font-semibold">
                              ₹{(result.price ?? 0).toLocaleString('en-IN')}
                              <span className="text-muted-foreground text-sm font-normal">/night</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground/80 mb-2">Search for anything</h3>
              <p className="text-muted-foreground">Find hotels, homestays, temples, and services</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
