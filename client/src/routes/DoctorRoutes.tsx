import { Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doctorGetCurrentUser } from "@/services/doctor-auth.service";
import DoctorLayout from "@/layouts/DoctorLayout";

// Pages
import DoctorLoginPage from "@/pages/doctor/LoginPage";
import DoctorDashboardPage from "@/pages/doctor/DashboardPage";
import DoctorProfilePage from "@/pages/doctor/ProfilePage";
import DoctorPatientsPage from "@/pages/doctor/PatientsPage";
import DoctorPrescriptionsPage from "@/pages/doctor/PrescriptionsPage";
import DoctorAppointmentsPage from "@/pages/doctor/AppointmentsPage";

function DoctorProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isDoctor, setIsDoctor] = useState(false);

  useEffect(() => {
    doctorGetCurrentUser()
      .then((data) => setIsDoctor(data?.user?.role === "doctor"))
      .catch(() => setIsDoctor(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!isDoctor) return <Navigate to="/doctor/login" replace />;

  return <DoctorLayout>{children}</DoctorLayout>;
}

export default function DoctorRoutes() {
  return (
    <Routes>
      <Route path="login" element={<DoctorLoginPage />} />
      <Route
        path=""
        element={
          <DoctorProtectedRoute>
            <DoctorDashboardPage />
          </DoctorProtectedRoute>
        }
      />
      <Route
        path="profile"
        element={
          <DoctorProtectedRoute>
            <DoctorProfilePage />
          </DoctorProtectedRoute>
        }
      />
      <Route
        path="patients"
        element={
          <DoctorProtectedRoute>
            <DoctorPatientsPage />
          </DoctorProtectedRoute>
        }
      />
      <Route
        path="prescriptions"
        element={
          <DoctorProtectedRoute>
            <DoctorPrescriptionsPage />
          </DoctorProtectedRoute>
        }
      />
      <Route
        path="appointments"
        element={
          <DoctorProtectedRoute>
            <DoctorAppointmentsPage />
          </DoctorProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/doctor" replace />} />
    </Routes>
  );
}
