import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DoctorLayout from "@/components/DoctorLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Patients from "@/pages/Patients";
import Prescriptions from "@/pages/Prescriptions";
import Appointments from "@/pages/Appointments";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <DoctorLayout>{children}</DoctorLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedLayout>
                <Profile />
              </ProtectedLayout>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedLayout>
                <Patients />
              </ProtectedLayout>
            }
          />
          <Route
            path="/prescriptions"
            element={
              <ProtectedLayout>
                <Prescriptions />
              </ProtectedLayout>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedLayout>
                <Appointments />
              </ProtectedLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;