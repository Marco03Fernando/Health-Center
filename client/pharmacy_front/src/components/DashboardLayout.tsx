import { Outlet, Navigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";

function isPharmacist() {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    return u && (u.role === "pharmacy" || u.role === "PHARMACIST");
  } catch {
    return false;
  }
}

export default function DashboardLayout() {
  const authenticated = isPharmacist();
  if (!authenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center border-b bg-white px-4">
          <h2 className="text-sm font-medium text-gray-700">Pharmacy Dashboard</h2>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
