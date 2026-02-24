import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

import kanakaDurgaImg from "@/assets/temples/kanaka-durga.jpg";
import undavalliImg from "@/assets/temples/undavalli.jpg";
import prakasamImg from "@/assets/temples/prakasam-barrage.jpg";
import mahanandiImg from "@/assets/temples/mahanandi.jpg";
import ahobilamImg from "@/assets/temples/ahobilam.jpg";
import srisailamImg from "@/assets/temples/srisailam.jpg";
import vetapalemImg from "@/assets/temples/vetapalem-temple.jpg";
import vodarevuImg from "@/assets/temples/vodarevu.jpg";

interface Temple {
  id: string;
  name: string;
  location: string;
  region: string;
  image: string;
  description: string;
}

const temples: Temple[] = [
  {
    id: "kanaka-durga",
    name: "Kanaka Durga Temple",
    location: "Vijayawada",
    region: "Vijayawada",
    image: kanakaDurgaImg,
    description: "Ancient temple dedicated to Goddess Durga, situated atop Indrakeeladri hill on Krishna riverbank.",
  },
  {
    id: "undavalli",
    name: "Undavalli Caves",
    location: "Vijayawada",
    region: "Vijayawada",
    image: undavalliImg,
    description: "Ancient rock-cut cave temples dating back to the 4th-5th century CE with stunning sculptures.",
  },
  {
    id: "prakasam-barrage",
    name: "Prakasam Barrage Temple",
    location: "Vijayawada",
    region: "Vijayawada",
    image: prakasamImg,
    description: "Sacred temple near the iconic Prakasam Barrage with beautiful Krishna river views.",
  },
  {
    id: "mahanandi",
    name: "Mahanandi Temple",
    location: "Nandyala",
    region: "Nandyala",
    image: mahanandiImg,
    description: "One of the nine Nandi temples, known for its perennial spring and ancient architecture.",
  },
  {
    id: "ahobilam",
    name: "Ahobilam Temple",
    location: "Nandyala",
    region: "Nandyala",
    image: ahobilamImg,
    description: "A cluster of nine Narasimha temples in the forested Nallamala Hills.",
  },
  {
    id: "srisailam",
    name: "Srisailam Temple",
    location: "Nandyala",
    region: "Nandyala",
    image: srisailamImg,
    description: "One of the 12 Jyotirlingas, this ancient temple is set amidst the dense Nallamala forests.",
  },
  {
    id: "vetapalem-temple",
    name: "Sri Venkateswara Temple",
    location: "Vetapalem",
    region: "Vetapalem",
    image: vetapalemImg,
    description: "Coastal temple dedicated to Lord Venkateswara with serene beach surroundings.",
  },
  {
    id: "chirala-beach-temple",
    name: "Vodarevu Beach Temple",
    location: "Vetapalem",
    region: "Vetapalem",
    image: vodarevuImg,
    description: "Beautiful seaside temple near the pristine Vodarevu beach.",
  },
];

const regions = ["All Regions", "Vijayawada", "Nandyala", "Vetapalem"];

const Temples = () => {
  const [selectedRegion, setSelectedRegion] = useState("All Regions");

  const filteredTemples = selectedRegion === "All Regions"
    ? temples
    : temples.filter((t) => t.region === selectedRegion);

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Divine Temples of Andhra Pradesh
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Explore sacred temples across three distinct regions, each with its own 
              unique spiritual significance and architectural beauty
            </p>
          </div>

          {/* Region Filter */}
          <div className="flex justify-center gap-2 flex-wrap mb-10">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedRegion === region
                    ? "gradient-gold text-primary-foreground shadow-gold"
                    : "bg-card text-muted-foreground hover:bg-muted shadow-card"
                }`}
              >
                {region}
              </button>
            ))}
          </div>

          {/* Temples Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemples.map((temple) => (
              <Link
                key={temple.id}
                to={`/temples/${temple.id}`}
                className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={temple.image}
                    alt={temple.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-block px-3 py-1 bg-primary/90 text-primary-foreground text-xs font-medium rounded-full mb-2">
                      {temple.region}
                    </span>
                    <h3 className="font-serif font-semibold text-xl text-cream-light">
                      {temple.name}
                    </h3>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    {temple.location}
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                    {temple.description}
                  </p>
                  <Button variant="goldOutline" className="w-full group-hover:variant-gold">
                    Learn More
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Temples;