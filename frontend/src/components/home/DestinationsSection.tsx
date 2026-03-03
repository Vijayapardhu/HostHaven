import { Link } from "react-router-dom";
import vijayawadaImg from "@/assets/destinations/vijayawada.jpg";
import nandyalaImg from "@/assets/destinations/nandyala.jpg";
import vetapalemImg from "@/assets/destinations/vetapalem.jpg";
import type { DestinationItem } from "@/hooks/useHomepageConfig";

const defaultDestinations = [
  { id: "nandyala", name: "Nandyala", image: nandyalaImg },
  { id: "vijayawada", name: "Vijayawada", image: vijayawadaImg },
  { id: "vetapalem", name: "Vetapalem", image: vetapalemImg },
];

const localImageMap: Record<string, string> = {
  nandyala: nandyalaImg,
  vijayawada: vijayawadaImg,
  vetapalem: vetapalemImg,
};

interface Props {
  items?: DestinationItem[];
}

const DestinationsSection = ({ items }: Props) => {
  const activeItems = items?.filter((i) => i.isActive);
  const useConfig = activeItems && activeItems.length > 0;

  const destinations = useConfig
    ? activeItems.map((item, i) => ({
        id: item.id,
        name: item.name || defaultDestinations[i]?.name || "",
        image: item.imageUrl || localImageMap[item.name?.toLowerCase()] || defaultDestinations[i]?.image || nandyalaImg,
        link: item.link || `/hotels?destination=${item.name?.toLowerCase()}`,
      }))
    : defaultDestinations.map((d) => ({ ...d, link: `/hotels?destination=${d.id}` }));

  return (
    <section className="py-6 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-lg md:text-2xl font-serif font-bold text-foreground mb-4">
          Top Destinations For You
        </h2>

        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {destinations.map((dest) => (
            <Link
              key={dest.id}
              to={dest.link}
              className="group relative rounded-xl overflow-hidden aspect-[3/4] shadow-card hover:shadow-card-hover transition-all"
            >
              <img
                src={dest.image}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown/90 via-heritage-brown/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                <h3 className="font-serif font-bold text-sm md:text-xl text-cream-light mb-1">
                  {dest.name}
                </h3>
                <button className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
                  Explore
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DestinationsSection;
