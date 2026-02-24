import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter } from "lucide-react";
import logo from "@/assets/logo.png";

interface FooterProps {
  className?: string;
}

const Footer = ({ className = "" }: FooterProps) => {
  return (
    <footer className={`bg-heritage-brown text-cream-light ${className}`}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <img src={logo} alt="HostHaven" className="h-16 w-auto brightness-110" />
            <p className="text-cream-light/80 text-sm leading-relaxed">
              Explore the rich heritage of Andhra Pradesh with premium stays, 
              authentic temple experiences, and seamless travel services.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-full bg-cream-light/10 hover:bg-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-cream-light/10 hover:bg-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-cream-light/10 hover:bg-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4 text-gold-light">Quick Links</h4>
            <ul className="space-y-2">
              {["Hotels", "Homes", "Temples", "Services", "About Us"].map((link) => (
                <li key={link}>
                  <Link
                    to={`/${link.toLowerCase().replace(" ", "-")}`}
                    className="text-cream-light/80 hover:text-gold-light transition-colors text-sm"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4 text-gold-light">Explore</h4>
            <ul className="space-y-2">
              {["Vijayawada", "Nandyala", "Vetapalem"].map((place) => (
                <li key={place}>
                  <span className="text-cream-light/80 text-sm">{place}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4 text-gold-light">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <span className="text-cream-light/80 text-sm">
                  Vijayawada, Andhra Pradesh, India
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <span className="text-cream-light/80 text-sm">+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <span className="text-cream-light/80 text-sm">info@hosthaven.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream-light/20 text-center">
          <p className="text-cream-light/60 text-sm">
            © 2024 HostHaven. All rights reserved. Explore Andhra's Heritage.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
