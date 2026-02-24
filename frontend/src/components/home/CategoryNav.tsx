import { Link, useLocation } from "react-router-dom";
import { Home, Hotel, House, Landmark, Wrench } from "lucide-react";

const categories = [
  { name: "Home", path: "/", icon: Home },
  { name: "Hotels", path: "/hotels", icon: Hotel },
  { name: "Homes", path: "/homes", icon: House },
  { name: "Temples", path: "/temples", icon: Landmark },
  { name: "Services", path: "/services", icon: Wrench },
];

const CategoryNav = () => {
  const location = useLocation();

  return (
    <section className="py-4 bg-card border-y border-border sticky top-16 md:top-20 z-30">
      <div className="container mx-auto px-4">
        <div className="flex justify-center gap-2 md:gap-8">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = location.pathname === cat.path;
            return (
              <Link
                key={cat.path}
                to={cat.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-gold"
                      : "bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span className="text-xs font-medium">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryNav;
