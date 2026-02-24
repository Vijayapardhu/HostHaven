import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const temples = [
  {
    id: "kanaka-durga",
    name: "Kanaka Durga Temple",
    location: "Vijayawada",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=600",
  },
  {
    id: "mahanandi",
    name: "Mahanandi Temple",
    location: "Nandyala",
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600",
  },
  {
    id: "tirumala",
    name: "Sri Venkateswara Temple",
    location: "Tirupati",
    image: "https://images.unsplash.com/photo-1545126221-15d5f92c9e2c?w=600",
  },
];

const TemplesPreview = () => {
  return (
    <section className="py-6 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-2xl font-serif font-bold text-foreground">
            Divine Temples
          </h2>
          <Link to="/temples">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {temples.map((temple) => (
            <Link
              key={temple.id}
              to={`/temples/${temple.id}`}
              className="group relative rounded-xl overflow-hidden aspect-[3/4] shadow-card hover:shadow-card-hover transition-all"
            >
              <img
                src={temple.image}
                alt={temple.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown/90 via-heritage-brown/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                <h3 className="font-serif font-semibold text-xs md:text-lg text-cream-light group-hover:text-gold-light transition-colors line-clamp-2">
                  {temple.name}
                </h3>
                <div className="flex items-center gap-1 text-cream-light/80 text-xs mt-1">
                  <MapPin className="w-3 h-3" />
                  {temple.location}
                </div>
                <button className="mt-2 bg-primary/90 text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-primary transition-colors">
                  Learn More
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TemplesPreview;