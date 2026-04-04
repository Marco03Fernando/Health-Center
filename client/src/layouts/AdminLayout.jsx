import { LayoutDashboard, Stethoscope, FileText, Building2, User, LogOut, Heart, } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarProvider, SidebarTrigger, useSidebar, } from "@/components/ui/sidebar";
import { Outlet, Navigate } from "react-router-dom";
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
        navigate("/admin/login");
    };
    return (<Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-primary flex items-center gap-2 px-3 py-4 text-base font-bold">
            <Heart className="h-5 w-5"/>
            {!collapsed && <span>MedAdmin</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (<SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="h-4 w-4 shrink-0"/>
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors hover:bg-destructive/20 hover:text-destructive">
              <LogOut className="h-4 w-4 shrink-0"/>
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>);
}
export default function AdminLayout() {
    const { isAuthenticated, isLoading } = useAdminAuth();
    if (isLoading) {
        return (<div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>);
    }
    if (!isAuthenticated)
        return <Navigate to="/admin/login" replace/>;
    return (<SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4">
            <SidebarTrigger className="mr-4"/>
            <h2 className="text-sm font-medium text-muted-foreground">
              Healthcare Administration
            </h2>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>);
}
