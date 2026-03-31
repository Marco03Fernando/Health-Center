import { Route, Routes, Navigate } from "react-router-dom";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import AdminLayout from "@/layouts/AdminLayout";

// Pages
import AdminLoginPage from "@/pages/admin/LoginPage";
import AdminDashboardPage from "@/pages/admin/DashboardPage";
import AdminDoctorsPage from "@/pages/admin/DoctorsPage";
import AdminCentersPage from "@/pages/admin/CentersPage";
import AdminPrescriptionsPage from "@/pages/admin/PrescriptionsPage";
import AdminProfilePage from "@/pages/admin/ProfilePage";

export default function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="dashboard"     element={<AdminDashboardPage />} />
          <Route path="doctors"       element={<AdminDoctorsPage />} />
          <Route path="prescriptions" element={<AdminPrescriptionsPage />} />
          <Route path="centers"       element={<AdminCentersPage />} />
          <Route path="profile"       element={<AdminProfilePage />} />
        </Route>
        <Route path=""  element={<Navigate to="/admin/login" replace />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
}
