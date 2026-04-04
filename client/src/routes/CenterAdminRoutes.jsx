import { Route, Routes, Navigate } from "react-router-dom";
import { CenterAdminProvider } from "@/contexts/CenterAdminContext";
import CenterAdminLayout from "@/layouts/CenterAdminLayout";
// Pages
import CenterAdminLoginPage from "@/pages/center-admin/LoginPage";
import CenterAdminOverviewPage from "@/pages/center-admin/OverviewPage";
import CenterAdminDoctorsPage from "@/pages/center-admin/DoctorsPage";
import CenterAdminPrescriptionsPage from "@/pages/center-admin/PrescriptionsPage";
import CenterAdminCenterInfoPage from "@/pages/center-admin/CenterInfoPage";
import CenterAdminSlotManagementPage from "@/pages/center-admin/SlotManagementPage";
import CenterAdminLabBookingsPage from "@/pages/center-admin/LabBookingsPage";
import BookingDetailPage from "@/pages/center-admin/BookingDetailPage";
export default function CenterAdminRoutes() {
    return (<CenterAdminProvider>
      <Routes>
        <Route path="login" element={<CenterAdminLoginPage />}/>
        <Route element={<CenterAdminLayout />}>
          <Route index element={<CenterAdminOverviewPage />}/>
          <Route path="doctors" element={<CenterAdminDoctorsPage />}/>
          <Route path="prescriptions" element={<CenterAdminPrescriptionsPage />}/>
          <Route path="center-info" element={<CenterAdminCenterInfoPage />}/>
          <Route path="slot-management" element={<CenterAdminSlotManagementPage />}/>
          <Route path="lab-bookings" element={<CenterAdminLabBookingsPage />}/>
          <Route path="lab-bookings/:bookingId" element={<BookingDetailPage />}/>
        </Route>
        <Route path="" element={<Navigate to="/center-admin/login" replace/>}/>
        <Route path="*" element={<Navigate to="/center-admin/login" replace/>}/>
      </Routes>
    </CenterAdminProvider>);
}
