import { LayoutDashboard, Box, ClipboardList, PackageCheck, LogOut, Heart, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";

export function AppSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r h-screen sticky top-0">
      <div className="px-4 py-6 flex items-center gap-3 border-b">
        <Heart className="h-6 w-6 text-rose-500" />
        <span className="font-semibold">Pharmacy</span>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          <li>
            <NavLink
              to="/pharmacy"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              activeClassName="bg-rose-50 text-rose-600 font-medium"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/pharmacy/inventory"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              activeClassName="bg-rose-50 text-rose-600 font-medium"
            >
              <PackageCheck className="h-4 w-4" />
              <span>Inventory</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/pharmacy/orders"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              activeClassName="bg-rose-50 text-rose-600 font-medium"
            >
              <ClipboardList className="h-4 w-4" />
              <span>Orders</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/pharmacy/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              activeClassName="bg-rose-50 text-rose-600 font-medium"
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t">
        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
