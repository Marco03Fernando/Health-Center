import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserApp } from "@/contexts/UserAppContext";
import { Heart, LayoutDashboard, Stethoscope, CalendarCheck, FileText, FileSearch, ShoppingBag, Package, User, LogOut, ShoppingCart, Menu, X, FlaskConical, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
const navItems = [
    { to: "/user", label: "Dashboard", icon: LayoutDashboard },
    { to: "/user/consult", label: "Consultation", icon: Stethoscope },
    { to: "/user/appointments", label: "Appointments", icon: CalendarCheck },
    { to: "/user/lab-bookings", label: "Lab Bookings", icon: FlaskConical },
    { to: "/user/test-reports", label: "Test Reports", icon: FileSearch },
    { to: "/user/prescriptions", label: "Prescriptions", icon: FileText },
    { to: "/user/marketplace", label: "Pharmacy", icon: ShoppingBag },
    { to: "/user/orders", label: "Orders", icon: Package },
    { to: "/user/profile", label: "Profile", icon: User },
];
export const UserLayout = ({ children }) => {
    const { user, logout, cart } = useUserApp();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    if (!user)
        return null;
    const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
    const isActive = (path) => path === "/user"
        ? location.pathname === "/user"
        : location.pathname.startsWith(path);
    const NavLinks = () => (<>
      {navItems.map((item) => (<Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isActive(item.to)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
          <item.icon className="w-4 h-4"/>
          {item.label}
        </Link>))}
    </>);
    return (<div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card fixed h-full z-30">
        <div className="p-5 border-b border-border">
          <Link to="/user" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl medical-gradient flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground"/>
            </div>
            <span className="font-display font-bold text-lg text-foreground">MediCare</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLinks />
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={() => { logout(); navigate("/user/auth"); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors">
            <LogOut className="w-4 h-4"/>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (<div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)}/>)}

      {/* Mobile Sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 transform transition-transform lg:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="p-5 border-b border-border flex justify-between items-center">
          <Link to="/user" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <div className="w-9 h-9 rounded-xl medical-gradient flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground"/>
            </div>
            <span className="font-display font-bold text-lg text-foreground">MediCare</span>
          </Link>
          <button onClick={() => setMobileOpen(false)}>
            <X className="w-5 h-5 text-muted-foreground"/>
          </button>
        </div>
        <nav className="p-3 space-y-1">
          <NavLinks />
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={() => { logout(); navigate("/user/auth"); setMobileOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full">
            <LogOut className="w-4 h-4"/>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5 text-foreground"/>
            </button>
            <h2 className="font-display font-semibold text-foreground text-lg hidden sm:block">
              {navItems.find((n) => isActive(n.to))?.label || "MediCare"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/user/cart")}>
              <ShoppingCart className="w-5 h-5"/>
              {cartCount > 0 && (<span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {cartCount}
                </span>)}
            </Button>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium text-accent-foreground">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>);
};
