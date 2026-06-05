import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Star, MapPin, Search } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WishlistButton from "@/components/WishlistButton";
import SEOHead from "@/components/SEOHead";
import { api } from "@/lib/api";
import { formatCity } from "@/lib/utils";
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
  slug?: string;
  name: string;
  city: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  images: Array<string | { url?: string; isPrimary?: boolean }>;
  amenities: string[];
}

interface CityData {
  city: string;
  state: string;
  count: number;
}

const Hotels = () => {
  const { city: citySlug } = useParams<{ city?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const destinationParam = searchParams.get("destination");
  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");
  const roomsParam = searchParams.get("rooms");
  const guestsParam = searchParams.get("guests");
  
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery]);

  const [selectedLocation, setSelectedLocation] = useState(() => {
    if (citySlug) {
      return citySlug.toUpperCase();
    }
    if (destinationParam) {
      const normalized = destinationParam.toUpperCase();
      return normalized;
    }
    return "all";
  });
  const [locations, setLocations] = useState<string[]>(["all"]);

  useEffect(() => {
    if (citySlug) {
      setSelectedLocation(citySlug.toUpperCase());
      return;
    }

    if (destinationParam) {
      const normalized = destinationParam.toUpperCase();
      setSelectedLocation(normalized);
    }
  }, [citySlug, destinationParam]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const cities = await api.properties.getCities();
        if (cities && Array.isArray(cities)) {
          const cityNames = cities.map((c: CityData) => c.city.toUpperCase());
          setLocations(["all", ...cityNames]);
        }
      } catch (err) {
        console.error("Failed to fetch cities:", err);
        setLocations(["all"]);
      }
    };
    fetchCities();
  }, []);

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
        if (debouncedSearch) params.search = debouncedSearch;
        // Only send city if it's a valid city (not 'all' or undefined)
        if (selectedLocation && selectedLocation !== "all") params.city = selectedLocation;
        if (checkInParam) params.checkIn = checkInParam;
        if (checkOutParam) params.checkOut = checkOutParam;
        if (guestsParam) params.guests = guestsParam;
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
  }, [page, debouncedSearch, selectedLocation, sortBy]);

  const filteredHotels = useMemo(() => hotels, [hotels]);

  const selectedCityLabel = selectedLocation === "all"
    ? "Andhra Pradesh"
    : formatCity(selectedLocation);

  const seoTitle =
    selectedLocation === "all"
      ? "Hotels in Andhra Pradesh"
      : `Hotels in ${selectedCityLabel}`;

  const seoDescription =
    selectedLocation === "all"
      ? "Discover verified hotels across Andhra Pradesh on HostHaven. Compare prices, amenities, and guest ratings before booking."
      : `Find the best hotels in ${selectedCityLabel} on HostHaven with verified listings, latest prices, and guest ratings.`;

  const seoKeywords =
    selectedLocation === "all"
      ? "HostHaven hotels, Andhra Pradesh hotels, hotel booking Andhra Pradesh"
      : `hotels in ${selectedCityLabel.toLowerCase()}, ${selectedCityLabel.toLowerCase()} hotel booking, HostHaven ${selectedCityLabel.toLowerCase()} hotels`;

  const canonicalPath = selectedLocation === "all"
    ? "/hotels"
    : `/hotels-in/${selectedLocation.toLowerCase()}`;

  const getHotelImage = (images: Hotel["images"]) => {
    if (!images?.length) return "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800";
    const primary = images.find((image) => typeof image !== "string" && image.isPrimary);
    const selected = primary || images[0];
    if (typeof selected === "string") return selected;
    return selected.url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800";
  };

  return (
    <Layout>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonical={`https://hosthaven.in${canonicalPath}`}
      />
      <div className="py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground">
              Hotels in Andhra Pradesh
            </h1>
            <p className="text-muted-foreground mt-2">
              Find the perfect stay for your journey
            </p>
            {(checkInParam || checkOutParam || roomsParam || guestsParam) && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {checkInParam && <span className="px-3 py-1 rounded-full bg-muted">Check In: {checkInParam}</span>}
                {checkOutParam && <span className="px-3 py-1 rounded-full bg-muted">Check Out: {checkOutParam}</span>}
                {roomsParam && <span className="px-3 py-1 rounded-full bg-muted">Rooms: {roomsParam}</span>}
                {guestsParam && <span className="px-3 py-1 rounded-full bg-muted">Guests: {guestsParam}</span>}
              </div>
            )}
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
              <div className="flex gap-2 overflow-x-auto flex-nowrap md:flex-wrap pb-2">
                <select
                  title="Sort hotels"
                  aria-label="Sort hotels"
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
                      const newParams = new URLSearchParams(searchParams);
                      if (loc === "all") {
                        newParams.delete("destination");
                      } else {
                        newParams.set("destination", loc.toLowerCase());
                      }
                      setSearchParams(newParams);
                    }}
                    className={`text-xs md:text-sm px-2 md:px-3 py-1 rounded-lg md:rounded-xl font-medium transition-all ${selectedLocation === loc
                        ? "gradient-gold text-primary-foreground shadow-gold"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                  >
                    {loc === "all" ? "All Locations" : formatCity(loc)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredHotels.map((hotel) => {
                const image = getHotelImage(hotel.images);
                
                // Build URL params for details page
                const detailParams = new URLSearchParams();
                if (checkInParam) detailParams.set("checkIn", checkInParam);
                if (checkOutParam) detailParams.set("checkOut", checkOutParam);
                if (guestsParam) detailParams.set("guests", guestsParam);
                if (roomsParam) detailParams.set("rooms", roomsParam);
                const detailQuery = detailParams.toString();
                
                return (
                  <Link
                    key={hotel.id}
                    to={`/hotels/${hotel.slug || hotel.id}${detailQuery ? `?${detailQuery}` : ''}`}
                    className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                  >
                    <div className="relative h-48 md:h-52 overflow-hidden">
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
                          location: formatCity(hotel.city),
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
                    <div className="p-3 md:p-5">
                      <h3 className="font-serif font-semibold text-lg md:text-xl text-foreground group-hover:text-primary transition-colors">
                        {hotel.name}
                      </h3>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                        <MapPin className="w-4 h-4" />
                        {formatCity(hotel.city)}
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
                            ₹{(hotel.basePrice || 0).toLocaleString('en-IN')}
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
                    <PaginationItem key={pageNumber} className="hidden sm:inline-flex">
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
