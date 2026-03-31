import { Route, Routes, Navigate } from "react-router-dom";
import { UserAppProvider, useUserApp } from "@/contexts/UserAppContext";
import { UserLayout } from "@/layouts/UserLayout";

// Pages
import UserAuthPage from "@/pages/user/AuthPage";
import UserDashboardPage from "@/pages/user/DashboardPage";
import UserConsultationPage from "@/pages/user/ConsultationPage";
import UserDoctorProfilePage from "@/pages/user/DoctorProfilePage";
import UserAppointmentsPage from "@/pages/user/AppointmentsPage";
import UserPrescriptionsPage from "@/pages/user/PrescriptionsPage";
import UserMarketplacePage from "@/pages/user/MarketplacePage";
import UserCartPage from "@/pages/user/CartPage";
import UserOrdersPage from "@/pages/user/OrdersPage";
import UserProfilePage from "@/pages/user/ProfilePage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useUserApp();
  if (!user) return <Navigate to="/user/auth" replace />;
  return <UserLayout>{children}</UserLayout>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user } = useUserApp();
  if (user) return <Navigate to="/user" replace />;
  return <>{children}</>;
}

function UserAppRoutes() {
  return (
    <Routes>
      <Route path="auth"           element={<AuthRoute><UserAuthPage /></AuthRoute>} />
      <Route path=""               element={<ProtectedRoute><UserDashboardPage /></ProtectedRoute>} />
      <Route path="consult"        element={<ProtectedRoute><UserConsultationPage /></ProtectedRoute>} />
      <Route path="doctors/:id"    element={<ProtectedRoute><UserDoctorProfilePage /></ProtectedRoute>} />
      <Route path="appointments"   element={<ProtectedRoute><UserAppointmentsPage /></ProtectedRoute>} />
      <Route path="prescriptions"  element={<ProtectedRoute><UserPrescriptionsPage /></ProtectedRoute>} />
      <Route path="marketplace"    element={<ProtectedRoute><UserMarketplacePage /></ProtectedRoute>} />
      <Route path="cart"           element={<ProtectedRoute><UserCartPage /></ProtectedRoute>} />
      <Route path="orders"         element={<ProtectedRoute><UserOrdersPage /></ProtectedRoute>} />
      <Route path="profile"        element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
      <Route path="*"              element={<Navigate to="/user/auth" replace />} />
    </Routes>
  );
}

export default function UserRoutes() {
  return (
    <UserAppProvider>
      <UserAppRoutes />
    </UserAppProvider>
  );
}
