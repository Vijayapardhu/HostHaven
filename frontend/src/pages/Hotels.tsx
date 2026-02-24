import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, Search } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WishlistButton from "@/components/WishlistButton";

interface Hotel {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  amenities: string[];
  roomTypes: string[];
}

const hotels: Hotel[] = [
  {
    id: "1",
    name: "Hotel Minerva Grand",
    location: "Vijayawada",
    price: 6500,
    rating: 4.7,
    reviews: 256,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    amenities: ["Pool", "Restaurant", "WiFi", "Gym"],
    roomTypes: ["Deluxe", "Suite", "Premium"],
  },
  {
    id: "2",
    name: "Fortune Murali Park",
    location: "Vijayawada",
    price: 7200,
    rating: 4.8,
    reviews: 312,
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    amenities: ["Pool", "Spa", "Restaurant", "WiFi"],
    roomTypes: ["Standard", "Deluxe", "Suite"],
  },
  {
    id: "3",
    name: "Sri Sai Residency",
    location: "Nandyala",
    price: 3200,
    rating: 4.5,
    reviews: 145,
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
    amenities: ["Restaurant", "WiFi", "Parking"],
    roomTypes: ["Standard", "Deluxe"],
  },
  {
    id: "4",
    name: "Hotel Raj Mahal",
    location: "Nandyala",
    price: 2800,
    rating: 4.3,
    reviews: 98,
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
    amenities: ["Restaurant", "WiFi", "AC"],
    roomTypes: ["Standard", "Deluxe"],
  },
  {
    id: "5",
    name: "Beach View Resort",
    location: "Vetapalem",
    price: 4800,
    rating: 4.6,
    reviews: 178,
    image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
    amenities: ["Beach Access", "Restaurant", "WiFi"],
    roomTypes: ["Sea View", "Deluxe", "Suite"],
  },
  {
    id: "6",
    name: "Coastal Inn",
    location: "Vetapalem",
    price: 3500,
    rating: 4.4,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
    amenities: ["Beach Nearby", "Restaurant", "Parking"],
    roomTypes: ["Standard", "Deluxe"],
  },
];

const Hotels = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");

  const locations = ["all", ...new Set(hotels.map((h) => h.location))];

  const filteredHotels = hotels.filter((hotel) => {
    const matchesSearch = hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === "all" || hotel.location === selectedLocation;
    return matchesSearch && matchesLocation;
  });

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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-muted border-0 rounded-xl"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHotels.map((hotel) => (
              <Link
                key={hotel.id}
                to={`/hotels/${hotel.id}`}
                className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <WishlistButton
                    variant="card"
                    item={{
                      id: hotel.id,
                      type: "hotel",
                      name: hotel.name,
                      location: hotel.location,
                      image: hotel.image,
                      price: hotel.price,
                      rating: hotel.rating,
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="text-sm font-medium">{hotel.rating}</span>
                    <span className="text-xs text-muted-foreground">({hotel.reviews})</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-serif font-semibold text-xl text-foreground group-hover:text-primary transition-colors">
                    {hotel.name}
                  </h3>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                    <MapPin className="w-4 h-4" />
                    {hotel.location}
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
                        ₹{hotel.price.toLocaleString()}
                        <span className="text-muted-foreground font-normal text-sm">/night</span>
                      </p>
                    </div>
                    <Button variant="gold" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Hotels;