import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MedicationInventory from "./pages/MedicationInventory";
import Orders from "./pages/Orders";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import DashboardLayout from "@/components/DashboardLayout";
import { AuthProvider } from "@/contexts/AuthContext";

function isPharmacist() {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    return u && (u.role === "pharmacy" || u.role === "PHARMACIST");
  } catch {
    return false;
  }
}

const PharmacyProtected = ({ children }: { children: React.ReactNode }) => {
  if (!isPharmacist()) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/pharmacy"
          element={
            <PharmacyProtected>
              <DashboardLayout />
            </PharmacyProtected>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<MedicationInventory />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="orders" element={<Orders />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
