import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, LogOut, Heart, Calendar, Settings, ChevronRight, LifeBuoy } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";

const Profile = () => {
  const { user, logout } = useAuth();
  const { items } = useWishlist();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) {
    return (
      <Layout>
        <div className="py-16">
          <div className="container mx-auto px-4 text-center">
            <User className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
              Please log in
            </h1>
            <p className="text-muted-foreground mb-6">
              Log in to view your profile and bookings
            </p>
            <Link to="/login">
              <Button variant="gold">Login</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
      navigate("/");
    }, 500);
  };

  const menuItems = [
    { icon: Heart, label: "My Wishlist", value: `${items.length} items`, path: "/wishlist" },
    { icon: Calendar, label: "My Bookings", value: "0 bookings", path: "/bookings" },
    { icon: LifeBuoy, label: "Support", value: "Open a ticket", path: "/profile/support" },
    { icon: Settings, label: "Settings", value: "", path: "/settings" },
  ];

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-card rounded-2xl shadow-card p-6 mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-primary">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-xl font-serif font-bold text-foreground">
                  {user.name}
                </h1>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-card overflow-hidden">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between p-4 hover:bg-muted transition-colors ${
                    index !== menuItems.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      {item.value && (
                        <p className="text-xs text-muted-foreground">{item.value}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              );
            })}
          </div>

          <Button
            variant="outline"
            className="w-full mt-6 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
