import { Link } from "react-router-dom";
import { MapPin, ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

import yagentiImg from "@/assets/temples/yaganti.jpg";
import mahanandiImg from "@/assets/temples/mahanandi.jpg";
import ahobilamImg from "@/assets/temples/ahobilam.jpg";
import srisailamImg from "@/assets/temples/srisailam.jpg";
import kanakaDurgaImg from "@/assets/temples/kanaka-durga.jpg";
import undavalliImg from "@/assets/temples/undavalli.jpg";

interface DeviationTemple {
  id: string;
  name: string;
  location: string;
  tagline: string;
  image: string;
}

const deviationTemples: DeviationTemple[] = [
  {
    id: "yaganti",
    name: "Yaganti Temple",
    location: "Kurnool District",
    tagline: "The Growing Nandi Wonder",
    image: yagentiImg,
  },
  {
    id: "mahanandi",
    name: "Mahanandi Temple",
    location: "Nandyala",
    tagline: "Sacred Springs of Shiva",
    image: mahanandiImg,
  },
  {
    id: "ahobilam",
    name: "Ahobilam Temple",
    location: "Nandyala",
    tagline: "Nine Forms of Narasimha",
    image: ahobilamImg,
  },
  {
    id: "srisailam",
    name: "Srisailam Temple",
    location: "Nallamala Hills",
    tagline: "Jyotirlinga in the Forests",
    image: srisailamImg,
  },
  {
    id: "kanaka-durga",
    name: "Kanaka Durga Temple",
    location: "Vijayawada",
    tagline: "Goddess on Indrakeeladri",
    image: kanakaDurgaImg,
  },
  {
    id: "undavalli",
    name: "Undavalli Caves",
    location: "Vijayawada",
    tagline: "Ancient Rock-Cut Marvels",
    image: undavalliImg,
  },
];

const DeviationTemples = () => {
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {deviationTemples.map((temple) => (
              <Link
                key={temple.id}
                to={`/temples/${temple.id}`}
                className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={temple.image}
                    alt={temple.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-gold-light text-xs font-medium mb-1">{temple.tagline}</p>
                    <h3 className="font-serif font-semibold text-lg text-cream-light">
                      {temple.name}
                    </h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    {temple.location}
                  </div>
                  <Button variant="goldOutline" size="sm" className="w-full">
                    View Details
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

export default DeviationTemples;
