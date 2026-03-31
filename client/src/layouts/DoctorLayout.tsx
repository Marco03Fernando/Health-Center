import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Users,
  ClipboardList,
  Calendar,
  LogOut,
  Menu,
  X,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { doctorLogout } from "@/services/doctor-auth.service";

const navItems = [
  { to: "/doctor",               label: "Dashboard",     icon: LayoutDashboard },
  { to: "/doctor/profile",       label: "Profile",       icon: User },
  { to: "/doctor/patients",      label: "Patients",      icon: Users },
  { to: "/doctor/prescriptions", label: "Prescriptions", icon: ClipboardList },
  { to: "/doctor/appointments",  label: "Appointments",  icon: Calendar },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await doctorLogout();
      toast.success("Logged out successfully");
      navigate("/doctor/login");
    } catch (err: any) {
      toast.error(err.message || "Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  const isActive = (path: string) =>
    path === "/doctor"
      ? location.pathname === "/doctor"
      : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Stethoscope className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-primary-foreground">MedPortal</h1>
              <p className="text-xs text-sidebar-foreground/60">Doctor Panel</p>
            </div>
            <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.to)
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-destructive disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-4 border-b bg-card px-4 py-3 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">
            {navItems.find((i) => isActive(i.to))?.label ?? "MedPortal"}
          </h2>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
