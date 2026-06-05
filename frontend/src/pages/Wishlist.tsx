import { Link } from "react-router-dom";
import { Heart, MapPin, Star, Trash2, Hotel, Home, Landmark } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useWishlist, WishlistItem } from "@/contexts/WishlistContext";

const getTypeIcon = (type: WishlistItem["type"]) => {
  switch (type) {
    case "hotel":
      return Hotel;
    case "home":
      return Home;
    case "temple":
      return Landmark;
  }
};

const getTypePath = (type: WishlistItem["type"]) => {
  switch (type) {
    case "hotel":
      return "/hotels";
    case "home":
      return "/homes";
    case "temple":
      return "/temples";
  }
};

const Wishlist = () => {
  const { items, removeFromWishlist } = useWishlist();

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="w-8 h-8 text-primary fill-primary" />
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                My Wishlist
              </h1>
              <p className="text-muted-foreground mt-1">
                {items.length} {items.length === 1 ? "item" : "items"} saved
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-muted-foreground mb-6">
                Start exploring and save your favorite places!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/hotels">
                  <Button variant="gold">Explore Hotels</Button>
                </Link>
                <Link to="/temples">
                  <Button variant="outline">Visit Temples</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                const TypeIcon = getTypeIcon(item.type);
                const basePath = getTypePath(item.type);
                return (
                  <div
                    key={item.id}
                    className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                  >
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
                        <TypeIcon className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-medium capitalize">{item.type}</span>
                      </div>
                      {item.rating && (
                        <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                          <Star className="w-4 h-4 text-primary fill-primary" />
                          <span className="text-sm font-medium">{item.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-serif font-semibold text-xl text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                        <MapPin className="w-4 h-4" />
                        {item.location}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        {item.price != null ? (
                          <div>
                            <p className="text-sm text-muted-foreground">Starting from</p>
                            <p className="text-xl font-semibold text-foreground">
                              ₹{item.price.toLocaleString('en-IN')}
                              <span className="text-muted-foreground font-normal text-sm">/night</span>
                            </p>
                          </div>
                        ) : (
                          <div />
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeFromWishlist(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Link to={`${basePath}/${item.id}`}>
                            <Button variant="gold" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Wishlist;
