import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, Search, Home, Users, Bed } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RentalHome {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  bedrooms: number;
  guests: number;
  amenities: string[];
}

const homes: RentalHome[] = [
  {
    id: "1",
    name: "Krishna Riverside Villa",
    location: "Vijayawada",
    price: 4500,
    rating: 4.7,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    bedrooms: 3,
    guests: 6,
    amenities: ["River View", "Kitchen", "Garden", "WiFi"],
  },
  {
    id: "2",
    name: "City Center Apartment",
    location: "Vijayawada",
    price: 3200,
    rating: 4.5,
    reviews: 67,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    bedrooms: 2,
    guests: 4,
    amenities: ["AC", "Kitchen", "Parking", "WiFi"],
  },
  {
    id: "3",
    name: "Heritage Cottage",
    location: "Nandyala",
    price: 2800,
    rating: 4.4,
    reviews: 56,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    bedrooms: 2,
    guests: 4,
    amenities: ["Garden", "Kitchen", "Parking"],
  },
  {
    id: "4",
    name: "Traditional Home Stay",
    location: "Nandyala",
    price: 2200,
    rating: 4.3,
    reviews: 45,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    bedrooms: 3,
    guests: 6,
    amenities: ["Courtyard", "Kitchen", "Local Guide"],
  },
  {
    id: "5",
    name: "Seaside Home",
    location: "Vetapalem",
    price: 3500,
    rating: 4.6,
    reviews: 78,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    bedrooms: 3,
    guests: 6,
    amenities: ["Beach Access", "Kitchen", "Balcony", "WiFi"],
  },
  {
    id: "6",
    name: "Beach Cottage",
    location: "Vetapalem",
    price: 2900,
    rating: 4.5,
    reviews: 62,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    bedrooms: 2,
    guests: 4,
    amenities: ["Sea View", "Kitchen", "Parking"],
  },
];

const Homes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");

  const locations = ["all", ...new Set(homes.map((h) => h.location))];

  const filteredHomes = homes.filter((home) => {
    const matchesSearch = home.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      home.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === "all" || home.location === selectedLocation;
    return matchesSearch && matchesLocation;
  });

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Rental Homes
            </h1>
            <p className="text-muted-foreground mt-2">
              Experience authentic local stays across Andhra Pradesh
            </p>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-2xl shadow-card p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search homes..."
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

          {/* Homes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHomes.map((home) => (
              <Link
                key={home.id}
                to={`/homes/${home.id}`}
                className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={home.image}
                    alt={home.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="text-sm font-medium">{home.rating}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-serif font-semibold text-xl text-foreground group-hover:text-primary transition-colors">
                    {home.name}
                  </h3>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                    <MapPin className="w-4 h-4" />
                    {home.location}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Bed className="w-4 h-4" />
                      {home.bedrooms} beds
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {home.guests} guests
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-xl font-semibold text-foreground">
                        ₹{home.price.toLocaleString()}
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

export default Homes;