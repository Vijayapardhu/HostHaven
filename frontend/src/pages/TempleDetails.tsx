import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { MapPin, Clock, ArrowLeft } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

import kanakaDurgaImg from "@/assets/temples/kanaka-durga.jpg";
import undavalliImg from "@/assets/temples/undavalli.jpg";
import prakasamImg from "@/assets/temples/prakasam-barrage.jpg";
import mahanandiImg from "@/assets/temples/mahanandi.jpg";
import ahobilamImg from "@/assets/temples/ahobilam.jpg";
import srisailamImg from "@/assets/temples/srisailam.jpg";
import yagentiImg from "@/assets/temples/yaganti.jpg";
import vetapalemImg from "@/assets/temples/vetapalem-temple.jpg";
import vodarevuImg from "@/assets/temples/vodarevu.jpg";

interface DarshanType {
  name: string;
  duration: string;
  price: string;
  description: string;
}

interface TempleData {
  id: string;
  name: string;
  location: string;
  region: string;
  images: string[];
  history: string;
  timings: {
    morning: string;
    evening: string;
    special: string;
  };
  darshanTypes: DarshanType[];
  nearbyHotels: string[];
}

const templeData: Record<string, TempleData> = {
  "kanaka-durga": {
    id: "kanaka-durga",
    name: "Kanaka Durga Temple",
    location: "Vijayawada, Krishna District",
    region: "Coastal Andhra",
    images: [kanakaDurgaImg],
    history: `The Kanaka Durga Temple is an ancient Hindu temple dedicated to Goddess Durga, situated atop the Indrakeeladri hill on the banks of the Krishna River in Vijayawada.`,
    timings: { morning: "5:30 AM - 12:30 PM", evening: "4:00 PM - 9:00 PM", special: "Extended hours during Navaratri" },
    darshanTypes: [
      { name: "Free Darshan", duration: "2-4 hours", price: "Free", description: "Regular queue darshan" },
      { name: "Special Darshan", duration: "1-2 hours", price: "₹100", description: "Faster darshan through special entrance" },
    ],
    nearbyHotels: ["Fortune Murali Park", "The Gateway Hotel"],
  },
  undavalli: {
    id: "undavalli",
    name: "Undavalli Caves",
    location: "Vijayawada",
    region: "Coastal Andhra",
    images: [undavalliImg],
    history: `Undavalli Caves are ancient rock-cut cave temples dating back to the 4th-5th century CE. These monolithic caves feature stunning sculptures and are a fine example of Indian rock-cut architecture. The caves house a large statue of Vishnu in a reclining posture.`,
    timings: { morning: "9:00 AM - 12:30 PM", evening: "1:30 PM - 5:30 PM", special: "Closed on Fridays" },
    darshanTypes: [
      { name: "General Entry", duration: "1 hour", price: "₹25", description: "Standard entry to explore the caves" },
    ],
    nearbyHotels: ["Fortune Murali Park", "Hotel Kandhari"],
  },
  "prakasam-barrage": {
    id: "prakasam-barrage",
    name: "Prakasam Barrage Temple",
    location: "Vijayawada",
    region: "Coastal Andhra",
    images: [prakasamImg],
    history: `Sacred temple near the iconic Prakasam Barrage with beautiful Krishna river views. The barrage itself is a major landmark connecting Krishna and Guntur districts.`,
    timings: { morning: "6:00 AM - 12:00 PM", evening: "4:00 PM - 8:00 PM", special: "Open all days" },
    darshanTypes: [
      { name: "Regular Darshan", duration: "30 mins", price: "Free", description: "Standard darshan for all devotees" },
    ],
    nearbyHotels: ["Hotel Ilapuram", "Fortune Murali Park"],
  },
  mahanandi: {
    id: "mahanandi",
    name: "Mahanandi Temple",
    location: "Nandyala, Kurnool District",
    region: "Rayalaseema",
    images: [mahanandiImg],
    history: `Mahanandi Temple is a famous Hindu temple dedicated to Lord Shiva. It is one of the nine Nandi temples in the Nallamala forest region. Known for its sacred pushkarini and beautiful surroundings.`,
    timings: { morning: "5:30 AM - 12:30 PM", evening: "4:00 PM - 8:30 PM", special: "Special timings during Maha Shivaratri" },
    darshanTypes: [
      { name: "Regular Darshan", duration: "1-2 hours", price: "Free", description: "Standard darshan for all devotees" },
    ],
    nearbyHotels: ["Sri Sai Residency"],
  },
  yaganti: {
    id: "yaganti",
    name: "Yaganti Uma Maheshwara Temple",
    location: "Kurnool District",
    region: "Rayalaseema",
    images: [yagentiImg],
    history: `Yaganti Temple is a famous ancient temple dedicated to Lord Shiva located in the Kurnool district. The temple is renowned for its Nandi statue that is believed to be growing in size over the years. The temple complex includes a cave temple and is surrounded by the stunning Nallamala Hills. It is a popular weekend destination for devotees across Andhra Pradesh.`,
    timings: { morning: "6:00 AM - 12:30 PM", evening: "3:00 PM - 8:00 PM", special: "Special poojas during Maha Shivaratri" },
    darshanTypes: [
      { name: "Regular Darshan", duration: "1-2 hours", price: "Free", description: "Standard darshan for all devotees" },
      { name: "Special Pooja", duration: "30-45 mins", price: "₹200", description: "Special abhishekam and pooja" },
    ],
    nearbyHotels: ["AP Tourism Guest House", "Local Lodges"],
  },
  ahobilam: {
    id: "ahobilam",
    name: "Ahobilam Narasimha Temple",
    location: "Nandyala, Kurnool District",
    region: "Rayalaseema",
    images: [ahobilamImg],
    history: `Ahobilam is a cluster of nine Narasimha temples nestled in the forested Nallamala Hills. It is believed to be the place where Lord Narasimha appeared to save Prahlada. The nine shrines are divided between Upper Ahobilam and Lower Ahobilam, each with its unique form of Lord Narasimha.`,
    timings: { morning: "6:00 AM - 1:00 PM", evening: "3:00 PM - 7:00 PM", special: "Narasimha Jayanti celebrations" },
    darshanTypes: [
      { name: "Regular Darshan", duration: "2-3 hours", price: "Free", description: "Visit all nine shrines" },
      { name: "Special Darshan", duration: "1-2 hours", price: "₹100", description: "Priority darshan" },
    ],
    nearbyHotels: ["APTDC Guest House", "Local Lodges"],
  },
  srisailam: {
    id: "srisailam",
    name: "Srisailam Mallikarjuna Temple",
    location: "Nallamala Hills",
    region: "Rayalaseema",
    images: [srisailamImg],
    history: `Srisailam is one of the 12 Jyotirlingas and one of the 18 Shakti Peethas, making it doubly sacred. Set amidst the dense Nallamala forests along the Krishna River, this ancient temple is dedicated to Lord Mallikarjuna Swamy and Goddess Bhramaramba Devi.`,
    timings: { morning: "4:30 AM - 1:00 PM", evening: "2:00 PM - 9:00 PM", special: "Maha Shivaratri special darshan" },
    darshanTypes: [
      { name: "Free Darshan", duration: "2-4 hours", price: "Free", description: "Standard darshan" },
      { name: "Special Darshan", duration: "1 hour", price: "₹150", description: "Priority entry" },
    ],
    nearbyHotels: ["APTDC Haritha Hotel", "Srisailam Guest Houses"],
  },
  "vetapalem-temple": {
    id: "vetapalem-temple",
    name: "Sri Venkateswara Temple",
    location: "Vetapalem",
    region: "Coastal Andhra",
    images: [vetapalemImg],
    history: `Coastal temple dedicated to Lord Venkateswara with serene beach surroundings. A peaceful spiritual retreat in the Vetapalem region.`,
    timings: { morning: "6:00 AM - 12:00 PM", evening: "4:00 PM - 8:00 PM", special: "Special events during Brahmotsavam" },
    darshanTypes: [
      { name: "Regular Darshan", duration: "30 mins - 1 hour", price: "Free", description: "Standard darshan" },
    ],
    nearbyHotels: ["Local Guest Houses"],
  },
  "chirala-beach-temple": {
    id: "chirala-beach-temple",
    name: "Vodarevu Beach Temple",
    location: "Vetapalem",
    region: "Coastal Andhra",
    images: [vodarevuImg],
    history: `Beautiful seaside temple near the pristine Vodarevu beach. A tranquil spot combining spiritual devotion with the serenity of the coast.`,
    timings: { morning: "6:00 AM - 12:00 PM", evening: "4:00 PM - 7:30 PM", special: "Open all days" },
    darshanTypes: [
      { name: "Regular Darshan", duration: "30 mins", price: "Free", description: "Standard darshan" },
    ],
    nearbyHotels: ["Beach Resorts", "Local Lodges"],
  },
};

const defaultTemple: TempleData = {
  id: "default",
  name: "Temple",
  location: "Andhra Pradesh",
  region: "Andhra",
  images: [kanakaDurgaImg],
  history: "This ancient temple holds deep spiritual significance in the region.",
  timings: {
    morning: "6:00 AM - 12:00 PM",
    evening: "4:00 PM - 8:00 PM",
    special: "Extended hours during festivals",
  },
  darshanTypes: [
    {
      name: "Regular Darshan",
      duration: "1-2 hours",
      price: "Free",
      description: "Standard darshan for all devotees",
    },
  ],
  nearbyHotels: ["Local Hotels Available"],
};

const TempleDetails = () => {
  const { id } = useParams();
  const temple = templeData[id || ""] || defaultTemple;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll functionality
  useEffect(() => {
    const startAutoScroll = () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
      autoScrollInterval.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % temple.images.length);
      }, 3500);
    };

    startAutoScroll();
    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [temple.images.length]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentImageIndex((prev) => (prev + 1) % temple.images.length);
    }
    if (isRightSwipe) {
      setCurrentImageIndex((prev) => (prev - 1 + temple.images.length) % temple.images.length);
    }

    // Reset auto-scroll after manual swipe
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
    autoScrollInterval.current = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % temple.images.length);
    }, 3500);

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <Layout>
      <div className="py-3 md:py-6">
        <div className="container mx-auto px-4 md:px-6">
          {/* Back Button */}
          <Link to="/temples" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 md:mb-6 text-sm md:text-base">
            <ArrowLeft className="w-4 h-4" />
            Back to Temples
          </Link>

          {/* Images - Vertical on mobile, Hero on desktop */}
          <div className="mb-6 md:mb-8">
            {/* Mobile: Horizontal scroll gallery */}
            <div className="md:hidden">
              <div className="relative -mx-4 px-4">
                <div 
                  className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-lg bg-muted"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {temple.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${temple.name} ${index + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                        index === currentImageIndex
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-105 blur-sm"
                      }`}
                    />
                  ))}
                  {/* Gradient Overlay - Only on active image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown/90 via-heritage-brown/30 to-transparent pointer-events-none">
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="inline-block px-2.5 py-1 bg-gold/90 text-foreground text-xs font-semibold rounded-full mb-2 shadow-sm">
                        {temple.region}
                      </span>
                      <h1 className="text-lg font-serif font-bold text-cream-light leading-tight">
                        {temple.name}
                      </h1>
                      <div className="flex items-center gap-1 text-cream-light/90 text-xs mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {temple.location}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-1.5 mt-3">
                {temple.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'w-4 bg-primary'
                        : 'w-1.5 bg-muted-foreground/40'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop: Hero Image */}
            <div className="hidden md:block relative rounded-2xl overflow-hidden aspect-[21/9]">
              <img
                src={temple.images[0]}
                alt={temple.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown/80 via-heritage-brown/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="inline-block px-3 py-1 bg-primary/90 text-primary-foreground text-sm font-medium rounded-full mb-3">
                  {temple.region}
                </span>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-cream-light">
                  {temple.name}
                </h1>
                <div className="flex items-center gap-2 text-cream-light/80 mt-2">
                  <MapPin className="w-5 h-5" />
                  {temple.location}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 md:space-y-8">
              {/* History */}
              <div className="bg-card rounded-xl md:rounded-2xl shadow-card p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-serif font-semibold text-foreground mb-3 md:mb-4">
                  History & Significance
                </h2>
                <div className="text-muted-foreground text-sm md:text-base leading-relaxed whitespace-pre-line">
                  {temple.history}
                </div>
              </div>

              {/* Darshan Types */}
              <div className="bg-card rounded-xl md:rounded-2xl shadow-card p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-serif font-semibold text-foreground mb-3 md:mb-4">
                  Types of Darshan
                </h2>
                <div className="space-y-3 md:space-y-4">
                  {temple.darshanTypes.map((darshan, index) => (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 p-3 md:p-4 bg-muted/60 md:bg-muted rounded-lg md:rounded-xl"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-sm md:text-base">{darshan.name}</h3>
                        <p className="text-muted-foreground text-xs md:text-sm mt-1 leading-relaxed">{darshan.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs md:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            {darshan.duration}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end md:text-right">
                        <p className="text-lg md:text-xl font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg">{darshan.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4 md:space-y-6">
              {/* Timings Card */}
              <div className="bg-card rounded-xl md:rounded-2xl shadow-card p-4 md:p-6 lg:sticky lg:top-24">
                <h3 className="text-base md:text-lg font-serif font-semibold text-foreground mb-3 md:mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Temple Timings
                </h3>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Morning</p>
                    <p className="font-medium text-foreground text-sm md:text-base">{temple.timings.morning}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Evening</p>
                    <p className="font-medium text-foreground text-sm md:text-base">{temple.timings.evening}</p>
                  </div>
                  <div className="pt-3 md:pt-4 border-t border-border">
                    <p className="text-xs md:text-sm text-muted-foreground">Special Note</p>
                    <p className="text-xs md:text-sm text-foreground mt-1">{temple.timings.special}</p>
                  </div>
                </div>

                <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border">
                  <h4 className="font-medium text-foreground mb-2 md:mb-3 text-sm md:text-base">Nearby Hotels</h4>
                  <div className="space-y-1.5 md:space-y-2">
                    {temple.nearbyHotels.map((hotel, index) => (
                      <Link
                        key={index}
                        to="/hotels"
                        className="block text-xs md:text-sm text-primary hover:underline"
                      >
                        {hotel}
                      </Link>
                    ))}
                  </div>
                  <Link to="/hotels" className="block mt-3 md:mt-4">
                    <Button variant="gold" className="w-full h-10 md:h-11 text-sm md:text-base">
                      Book Nearby Stay
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TempleDetails;