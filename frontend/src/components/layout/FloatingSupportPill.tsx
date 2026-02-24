import { useState } from "react";
import { Headphones, X, MapPin, Phone, Mail, Clock, Building2, Globe, ChevronRight } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import logo from "@/assets/logo.png";

const FloatingSupportPill = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Pill - Bottom Right */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[50]">
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 rounded-full pl-1.5 pr-5 py-1.5 bg-gradient-to-r from-heritage-brown via-heritage-brown/95 to-heritage-brown/90 shadow-lg shadow-heritage-brown/30 cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-heritage-brown/40 border border-gold/30"
        >
          {/* Icon with elegant glow */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-inner">
            <Headphones className="w-5 h-5 text-heritage-brown" />
          </div>
          
          {/* Text content */}
          <div className="text-cream-light">
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-sm text-gold-light tracking-wide animate-subtle-pulse">24/7</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-sm shadow-green-400/50"></span>
            </div>
            <p className="text-xs text-cream-light/80 font-medium">Premium Support</p>
          </div>
        </button>
      </div>

      {/* Company Details Drawer */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="bg-card border-t border-border max-h-[85vh]">
          <DrawerHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={logo} alt="HostHaven" className="h-10 w-auto" />
                <DrawerTitle className="font-serif text-lg text-foreground">HostHaven</DrawerTitle>
              </div>
              <DrawerClose className="rounded-full p-2 hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="p-4 space-y-4 overflow-y-auto">
            {/* Company Info */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                About Us
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                HostHaven is your trusted partner for exploring the rich heritage of Andhra Pradesh. 
                We offer premium stays, authentic temple experiences, and seamless travel services.
              </p>
            </div>

            {/* Contact Options */}
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground text-sm px-1">Contact Us</h3>
              
              <a href="tel:+919876543210" className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Call Us</p>
                    <p className="text-xs text-muted-foreground">+91 98765 43210</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>

              <a href="mailto:info@hosthaven.in" className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Email Us</p>
                    <p className="text-xs text-muted-foreground">info@hosthaven.in</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Location</p>
                    <p className="text-xs text-muted-foreground">Vijayawada, Andhra Pradesh</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-gold-dark" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Working Hours</p>
                    <p className="text-xs text-muted-foreground">24/7 Available</p>
                  </div>
                </div>
              </div>

              <a href="#" className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Website</p>
                    <p className="text-xs text-muted-foreground">www.hosthaven.in</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-primary/5 rounded-xl p-3 text-center">
                <p className="font-bold text-lg text-primary">500+</p>
                <p className="text-xs text-muted-foreground">Hotels</p>
              </div>
              <div className="bg-gold/5 rounded-xl p-3 text-center">
                <p className="font-bold text-lg text-gold-dark">100+</p>
                <p className="text-xs text-muted-foreground">Temples</p>
              </div>
              <div className="bg-green-500/5 rounded-xl p-3 text-center">
                <p className="font-bold text-lg text-green-600">10K+</p>
                <p className="text-xs text-muted-foreground">Guests</p>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default FloatingSupportPill;
