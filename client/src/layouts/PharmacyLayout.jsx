import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  PackageCheck,
  ClipboardList,
  User,
  LogOut,
  Heart,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link, Navigate, Outlet } from "react-router-dom";
import { usePharmacyAuth } from "@/contexts/PharmacyAuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/pharmacy", icon: LayoutDashboard, end: true },
  { title: "Inventory", url: "/pharmacy/inventory", icon: PackageCheck },
  { title: "Orders", url: "/pharmacy/orders", icon: ClipboardList },
  // Profile entry removed
];

function PharmacySidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { logout } = usePharmacyAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await logout();
    } finally {
      window.location.replace("/");
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="p-0">
            <Link
              to="/"
              className="text-sidebar-primary flex items-center gap-2 px-3 py-4 text-base font-bold transition-opacity hover:opacity-80"
            >
              <Heart className="h-5 w-5" />
              {!collapsed && <span>MediCare</span>}
            </Link>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors hover:bg-destructive/20 hover:text-destructive disabled:opacity-60"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{loggingOut ? "Logging out..." : "Logout"}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function PharmacyLayout() {
  const { isAuthenticated, isLoading, pharmacist, refreshAuth } = usePharmacyAuth();

  useEffect(() => {
    refreshAuth({ showLoader: true });
  }, [refreshAuth]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/pharmacy/login" replace />;
  }

  const headerTitle = pharmacist?.centerName
    ? `${pharmacist.centerName} — Pharmacy`
    : "Pharmacist Dashboard";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <PharmacySidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center border-b bg-card px-4">
            <SidebarTrigger className="mr-4" />
            <h2 className="text-sm font-medium text-muted-foreground">
              {headerTitle}
            </h2>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}