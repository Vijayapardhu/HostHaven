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
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
          {/* Brand */}
          <div className="space-y-4 md:space-y-5">
            <img src={logo} alt="HostHaven" className="h-12 md:h-14 w-auto brightness-110" />
            <p className="text-cream-light/70 text-xs md:text-sm leading-relaxed">
              Explore the rich heritage of Andhra Pradesh with premium stays, 
              authentic temple experiences, and seamless travel services.
            </p>
            <div className="flex gap-2 md:gap-3">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-cream-light/10 hover:bg-primary hover:scale-110 transition-all duration-200 flex items-center justify-center"
                >
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-base md:text-lg font-semibold mb-4 md:mb-5 text-gold-light">Quick Links</h4>
            <ul className="space-y-2 md:space-y-3">
              {[{ name: "Hotels", path: "/hotels" }, { name: "Homestays", path: "/homes" }, { name: "Temples", path: "/temples" }, { name: "Services", path: "/services" }, { name: "Contact", path: "/contact" }].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-cream-light/70 hover:text-gold-light transition-colors text-xs md:text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary/60 group-hover:bg-primary transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-base md:text-lg font-semibold mb-4 md:mb-5 text-gold-light">Contact Us</h4>
            <ul className="space-y-3 md:space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-cream-light/70 text-xs md:text-sm">{settings.contact.supportAddress || "Andhra Pradesh, India"}</span>
              </li>
              <li>
                <a href={`tel:${settings.contact.supportPhone}`} className="flex items-center gap-3 text-cream-light/70 hover:text-gold-light transition-colors text-xs md:text-sm">
                  <Phone className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                  {settings.contact.supportPhone || "+91 1234567890"}
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.contact.supportEmail}`} className="flex items-center gap-3 text-cream-light/70 hover:text-gold-light transition-colors text-xs md:text-sm">
                  <Mail className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                  {settings.contact.supportEmail || "support@hosthaven.in"}
                </a>
              </li>
            </ul>
          </div>

          {/* Support Hours */}
          <div>
            <h4 className="font-serif text-base md:text-lg font-semibold mb-4 md:mb-5 text-gold-light">Support Hours</h4>
            <div className="space-y-2 md:space-y-3 text-cream-light/70 text-xs md:text-sm">
              <p>{settings.contact.supportHours || "Mon - Sun: 24/7"}</p>
              <p className="text-cream-light/50 text-[11px] md:text-xs">We're here to help you anytime</p>
            </div>
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
          </div> {/* End Support Hours */}

        </div> {/* End grid */}

        <div className="mt-12 pt-8 border-t border-cream-light/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-cream-light/50 text-xs">
            © 2025 HostHaven. All rights reserved. Explore Andhra's Heritage.
          </p>
          <div className="flex items-center gap-6 text-xs text-cream-light/50">
            <Link to="/terms" className="hover:text-gold-light transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-gold-light transition-colors">Privacy</Link>
            <Link to="/profile/support" className="hover:text-gold-light transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
