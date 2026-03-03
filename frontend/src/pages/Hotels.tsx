import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, Search } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WishlistButton from "@/components/WishlistButton";
import { api } from "@/lib/api";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Hotel {
  id: string;
  name: string;
  city: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  images: Array<string | { url?: string; isPrimary?: boolean }>;
  amenities: string[];
}

const Hotels = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("popularity");

  useEffect(() => {
    const fetchHotels = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params: Record<string, string> = {
          type: "HOTEL",
          page: page.toString(),
          limit: "12",
          sortBy: sortBy === "newest" ? "createdAt" : sortBy,
        };
        if (searchQuery) params.search = searchQuery;
        // Only send city if it's a valid city (not 'all' or undefined)
        if (selectedLocation && selectedLocation !== "all") params.city = selectedLocation;
        const result = await api.properties.getAll(params);
        setHotels(result.data || []);
        setTotalPages(result.meta?.totalPages || 1);
      } catch (err: any) {
        setError(err?.message || "Failed to load hotels");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotels();
  }, [page, searchQuery, selectedLocation, sortBy]);

  const locations = useMemo(() => {
    const uniqueCities = new Set(hotels.map((hotel) => hotel.city));
    return ["all", ...Array.from(uniqueCities)];
  }, [hotels]);

  const filteredHotels = useMemo(() => hotels, [hotels]);

  const getHotelImage = (images: Hotel["images"]) => {
    if (!images?.length) return "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800";
    const primary = images.find((image) => typeof image !== "string" && image.isPrimary);
    const selected = primary || images[0];
    if (typeof selected === "string") return selected;
    return selected.url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800";
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Hotels in Andhra Pradesh
            </h1>
            <p className="text-muted-foreground mt-2">
              Find the perfect stay for your journey
            </p>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-2xl shadow-card p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search hotels..."
                  value={searchQuery}
                  onChange={(e) => {
                    setPage(1);
                    setSearchQuery(e.target.value);
                  }}
                  className="pl-10 h-12 bg-muted border-0 rounded-xl"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setPage(1);
                    setSortBy(event.target.value);
                  }}
                  className="h-12 rounded-xl bg-muted px-3 text-sm text-muted-foreground"
                >
                  <option value="popularity">Most booked</option>
                  <option value="rating">Top rated</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                  <option value="newest">Newest</option>
                </select>
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setPage(1);
                      setSelectedLocation(loc);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedLocation === loc
                        ? "gradient-gold text-primary-foreground shadow-gold"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {loc === "all" ? "All Locations" : loc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hotels Grid */}
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading hotels...</div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-lg font-semibold">Unable to load hotels</p>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No hotels match your filters.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotels.map((hotel) => {
                const image = getHotelImage(hotel.images);
                return (
                  <Link
                    key={hotel.id}
                    to={`/hotels/${hotel.id}`}
                    className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                  >
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={image}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <WishlistButton
                        variant="card"
                        item={{
                          id: hotel.id,
                          type: "hotel",
                          name: hotel.name,
                          location: hotel.city,
                          image: image,
                          price: hotel.basePrice,
                          rating: hotel.rating,
                        }}
                      />
                      <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                        <span className="text-sm font-medium">{hotel.rating}</span>
                        <span className="text-xs text-muted-foreground">({hotel.reviewCount})</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-serif font-semibold text-xl text-foreground group-hover:text-primary transition-colors">
                        {hotel.name}
                      </h3>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                        <MapPin className="w-4 h-4" />
                        {hotel.city}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {hotel.amenities.slice(0, 3).map((amenity) => (
                          <span
                            key={amenity}
                            className="px-2 py-1 bg-muted rounded-lg text-xs text-muted-foreground"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        <div>
                          <p className="text-sm text-muted-foreground">Starting from</p>
                          <p className="text-xl font-semibold text-foreground">
                            ₹{hotel.basePrice.toLocaleString()}
                            <span className="text-muted-foreground font-normal text-sm">/night</span>
                          </p>
                        </div>
                        <Button variant="gold" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!isLoading && !error && totalPages > 1 ? (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setPage((prev) => Math.max(1, prev - 1));
                      }}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        isActive={page === pageNumber}
                        onClick={(event) => {
                          event.preventDefault();
                          setPage(pageNumber);
                        }}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setPage((prev) => Math.min(totalPages, prev + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
};

export default Hotels;
