import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PublicLayout from "@/layouts/PublicLayout";
import AdminRoutes from "@/routes/AdminRoutes";
import CenterAdminRoutes from "@/routes/CenterAdminRoutes";
import DoctorRoutes from "@/routes/DoctorRoutes";
import UserRoutes from "@/routes/UserRoutes";
import LabTechRoutes from "@/routes/LabTechRoutes";
import PharmacyRoutes from "@/routes/PharmacyRoutes";
import HomePage from "@/pages/public/HomePage";
import AboutPage from "@/pages/public/AboutPage";
import ContactPage from "@/pages/public/ContactPage";
import DoctorsPage from "@/pages/public/DoctorsPage";
import LabTestsPage from "@/pages/public/LabTestsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public landing pages */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/lab-tests" element={<LabTestsPage />} />
          </Route>

          {/* Role-based portals */}
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/center-admin/*" element={<CenterAdminRoutes />} />
          <Route path="/doctor/*" element={<DoctorRoutes />} />
          <Route path="/user/*" element={<UserRoutes />} />
          <Route path="/lab-tech/*" element={<LabTechRoutes />} />
          <Route path="/pharmacy/*" element={<PharmacyRoutes />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
