import { Route, Routes, Navigate } from "react-router-dom";
import { PharmacyAuthProvider } from "@/contexts/PharmacyAuthContext";
import PharmacyLayout from "@/layouts/PharmacyLayout";

// Pages
import PharmacyLoginPage from "@/pages/pharmacy/LoginPage";
import PharmacyDashboardPage from "@/pages/pharmacy/DashboardPage";
import MedicationInventoryPage from "@/pages/pharmacy/MedicationInventoryPage";
import PharmacyOrdersPage from "@/pages/pharmacy/OrdersPage";

export default function PharmacyRoutes() {
  return (
    <PharmacyAuthProvider>
      <Routes>
        <Route path="login" element={<PharmacyLoginPage />} />

        {/* Protected routes under the shared layout */}
        <Route element={<PharmacyLayout />}>
          <Route index element={<PharmacyDashboardPage />} />
          <Route path="inventory" element={<MedicationInventoryPage />} />
          <Route path="orders" element={<PharmacyOrdersPage />} />
          {/* Profile route removed for pharmacy */}
        </Route>

        <Route path="" element={<Navigate to="/pharmacy/login" replace />} />
        <Route path="*" element={<Navigate to="/pharmacy/login" replace />} />
      </Routes>
    </PharmacyAuthProvider>
  );
}
