import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import AdminRoutes from "@/routes/AdminRoutes";
import CenterAdminRoutes from "@/routes/CenterAdminRoutes";
import DoctorRoutes from "@/routes/DoctorRoutes";
import UserRoutes from "@/routes/UserRoutes";
import LabTechRoutes from "@/routes/LabTechRoutes";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Default redirect to user portal */}
          <Route path="/" element={<Navigate to="/user" replace />} />

          {/* Role-based portals */}
          <Route path="/admin/*"         element={<AdminRoutes />} />
          <Route path="/center-admin/*"  element={<CenterAdminRoutes />} />
          <Route path="/doctor/*"        element={<DoctorRoutes />} />
          <Route path="/user/*"          element={<UserRoutes />} />
          <Route path="/lab-tech/*"      element={<LabTechRoutes />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
