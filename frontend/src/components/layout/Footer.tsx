import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter } from "lucide-react";
import logo from "@/assets/logo.png";
import { usePublicPlatformSettings } from "@/hooks/usePublicPlatformSettings";

interface FooterProps {
  className?: string;
}

const Footer = ({ className = "" }: FooterProps) => {
  const settings = usePublicPlatformSettings();

  return (
    <footer className={`bg-heritage-brown text-cream-light ${className}`}>
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-5">
            <img src={logo} alt="HostHaven" className="h-14 w-auto brightness-110" />
            <p className="text-cream-light/70 text-sm leading-relaxed">
              Explore the rich heritage of Andhra Pradesh with premium stays, 
              authentic temple experiences, and seamless travel services.
            </p>
            <div className="flex gap-3">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl bg-cream-light/10 hover:bg-primary hover:scale-110 transition-all duration-200 flex items-center justify-center"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-5 text-gold-light">Quick Links</h4>
            <ul className="space-y-3">
              {[{ name: "Hotels", path: "/hotels" }, { name: "Homestays", path: "/homes" }, { name: "Temples", path: "/temples" }, { name: "Services", path: "/services" }, { name: "Contact", path: "/contact" }].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-cream-light/70 hover:text-gold-light transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary/60 group-hover:bg-primary transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-5 text-gold-light">Explore</h4>
            <ul className="space-y-3">
              {["Vijayawada", "Nandyal", "Vetapalem", "Tirupati"].map((place) => (
                <li key={place}>
                  <Link
                    to={`/search?q=${place}`}
                    className="text-cream-light/70 hover:text-gold-light transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary/60 group-hover:bg-primary transition-colors" />
                    {place}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-5 text-gold-light">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <span className="text-cream-light/70 text-sm leading-relaxed">
                  {settings.contact.supportAddress}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <span className="text-cream-light/70 text-sm">{settings.contact.supportPhone}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <span className="text-cream-light/70 text-sm">{settings.contact.supportEmail}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream-light/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-cream-light/50 text-xs">
            © 2025 HostHaven. All rights reserved. Explore Andhra's Heritage.
          </p>
          <div className="flex items-center gap-6 text-xs text-cream-light/50">
            <Link to="/terms" className="hover:text-gold-light transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-gold-light transition-colors">Privacy</Link>
            <Link to="/support" className="hover:text-gold-light transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
