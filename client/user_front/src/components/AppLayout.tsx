import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Heart, LayoutDashboard, Stethoscope, CalendarCheck, FileText, ShoppingBag, Package, User, LogOut, ShoppingCart, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/consult', label: 'Consult', icon: Stethoscope },
  { to: '/appointments', label: 'Appointments', icon: CalendarCheck },
  { to: '/prescriptions', label: 'Prescriptions', icon: FileText },
  { to: '/marketplace', label: 'Pharmacy', icon: ShoppingBag },
  { to: '/orders', label: 'Orders', icon: Package },
  { to: '/profile', label: 'Profile', icon: User },
];

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout, cart } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card fixed h-full z-30">
        <div className="p-5 border-b border-border">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl medical-gradient flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">MediCare</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname === item.to
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={() => { logout(); navigate('/auth'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors">
            <LogOut className="w-4.5 h-4.5" />Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Mobile sidebar */}
      <aside className={cn('fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 transform transition-transform lg:hidden', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="p-5 border-b border-border flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <div className="w-9 h-9 rounded-xl medical-gradient flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">MediCare</span>
          </Link>
          <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname === item.to
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={() => { logout(); navigate('/auth'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full">
            <LogOut className="w-4.5 h-4.5" />Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <h2 className="font-display font-semibold text-foreground text-lg hidden sm:block">
              {navItems.find(n => n.to === location.pathname)?.label || 'MediCare'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/cart')}>
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">{cartCount}</span>
              )}
            </Button>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium text-accent-foreground">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
};
