import {
  LayoutDashboard,
  Stethoscope,
  FileText,
  Building2,
  User,
  LogOut,
  Heart,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate, Outlet, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
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
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Doctors", url: "/admin/doctors", icon: Stethoscope },
  { title: "Prescriptions", url: "/admin/prescriptions", icon: FileText },
  { title: "Centers", url: "/admin/centers", icon: Building2 },
  { title: "Profile", url: "/admin/profile", icon: User },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar">
      <SidebarContent className="px-3 py-4">
        <SidebarGroup className="gap-4">
          <SidebarGroupLabel className="p-0">
            <button
              type="button"
              onClick={() => navigate("/")}
              className={`group flex w-full items-center rounded-xl transition-all duration-200 hover:bg-sidebar-accent/60 ${
                collapsed ? "justify-center px-2 py-3" : "justify-start px-3 py-3.5"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary/10 text-sidebar-primary">
                <Heart className="h-5 w-5" />
              </div>

              {!collapsed && (
                <div className="ml-3 flex flex-col items-start text-left">
                  <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                    MedAdmin
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Admin Panel
                  </span>
                </div>
              )}
            </button>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="p-0">
                    <NavLink
                      to={item.url}
                      className={`group flex w-full items-center rounded-xl text-sm transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                        collapsed
                          ? "justify-center px-2 py-3"
                          : "justify-start gap-3 px-3 py-3"
                      } text-sidebar-foreground`}
                      activeClassName="bg-sidebar-accent text-sidebar-primary shadow-sm font-medium"
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4 pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className={`w-full rounded-xl text-sm transition-all duration-200 hover:bg-destructive/10 hover:text-destructive ${
                collapsed
                  ? "justify-center px-2 py-3"
                  : "justify-start gap-3 px-3 py-3"
              } text-sidebar-foreground`}
            >
              <LogOut className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout() {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center border-b bg-card px-4 md:px-6">
            <SidebarTrigger className="mr-4" />
            <h2 className="text-sm font-medium text-muted-foreground">
              Healthcare Administration
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