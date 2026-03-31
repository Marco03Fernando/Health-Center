import { Route, Routes, Navigate } from "react-router-dom";
import { LabTechProvider } from "@/contexts/LabTechContext";
import LabTechLayout from "@/layouts/LabTechLayout";

// Pages
import LabTechLoginPage from "@/pages/lab-tech/LoginPage";
import LabTechOverviewPage from "@/pages/lab-tech/OverviewPage";
import AddTestPage from "@/pages/lab-tech/AddTestPage";
import TestTypesPage from "@/pages/lab-tech/TestTypesPage";
import LabBookingsPage from "@/pages/lab-tech/LabBookingsPage";
import BookingDetailPage from "@/pages/lab-tech/BookingDetailPage";
import UpdateResultsPage from "@/pages/lab-tech/UpdateResultsPage";

export default function LabTechRoutes() {
  return (
    <LabTechProvider>
      <Routes>
        <Route path="login" element={<LabTechLoginPage />} />
        <Route element={<LabTechLayout />}>
          <Route index                        element={<LabTechOverviewPage />} />
          <Route path="add-test"              element={<AddTestPage />} />
          <Route path="test-types"            element={<TestTypesPage />} />
          <Route path="lab-bookings"          element={<LabBookingsPage />} />
          <Route path="lab-bookings/:bookingId" element={<BookingDetailPage />} />
          <Route path="update-results"        element={<UpdateResultsPage />} />
        </Route>
        <Route path=""  element={<Navigate to="/lab-tech/login" replace />} />
        <Route path="*" element={<Navigate to="/lab-tech/login" replace />} />
      </Routes>
    </LabTechProvider>
  );
}
