import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-foreground text-primary-foreground">
    <div className="section-container py-12">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-extrabold">Medicare</span>
          </Link>
          <p className="text-sm leading-relaxed opacity-70">
            Your trusted partner in healthcare — connecting patients with quality doctors, diagnostics, and medicines.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider opacity-80">Quick Links</h4>
          <ul className="space-y-2 text-sm opacity-70">
            {[
              { label: "Home", to: "/" },
              { label: "Doctors", to: "/doctors" },
              { label: "Lab Tests", to: "/lab-tests" },
              { label: "About", to: "/about" },
              { label: "Contact", to: "/contact" },
              { label: "Patient Portal", to: "/user" },
            ].map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="transition-opacity hover:opacity-100">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider opacity-80">Services</h4>
          <ul className="space-y-2 text-sm opacity-70">
            {["Doctor Consultation", "Lab Tests & Reports", "Health Records", "Prescriptions", "Medicine Store"].map(
              (s) => (
                <li key={s}>{s}</li>
              )
            )}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider opacity-80">Contact</h4>
          <ul className="space-y-3 text-sm opacity-70">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> +94 11 234 5678
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> hello@careconnect.lk
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> 123 Health Street, Colombo, Sri Lanka
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-10 border-t border-primary-foreground/10 pt-6 text-center text-xs opacity-50">
        © {new Date().getFullYear()} Medicare. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
