import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Calendar, User, Home, Shield } from 'lucide-react'
import BookAppointmentPage from './pages/bookAppointmentPage.jsx'
import UserDashboardPage from './pages/userDashboardPage.jsx'
import HealthcareCenterAdminDashboardPage from './pages/healthcareCenterAdminDashboardPage.jsx'
import SlotManagementPage from './pages/SlotManagementPage.jsx'
import BookingManagementPage from './pages/BookingManagementPage.jsx'
import SystemAdminDashboardPage from './pages/systemAdminDashboardPage.jsx'
import BookingConfirmationPage from './pages/bookingConfirmationPage.jsx'
import BookingDetailsPage from './pages/bookingDetailsPage.jsx'

function Sidebar() {
  const items = [
    { to: '/', label: 'Book Appointment', icon: Calendar },
    { to: '/user', label: 'User Dashboard', icon: User },
    { to: '/center-admin', label: 'Center Admin', icon: Home },
    { to: '/system-admin', label: 'System Admin', icon: Shield },
  ]
  return (
    <div className="w-64 bg-white border-r min-h-screen p-6 hidden md:flex flex-col">
      <div className="mb-6 text-2xl font-extrabold text-primary">HealthCenter</div>
      <nav className="space-y-2">
        {items.map((it) => (
          <Link key={it.to} to={it.to} className="flex items-center px-3 py-2 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-blue-600 transition group">
            <it.icon size={20} strokeWidth={2} className="text-slate-400 group-hover:text-blue-600" />
            <span className="ml-2 font-medium">{it.label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto text-xs text-gray-400">© HealthCenter</div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 md:p-10">
            <Routes>
              <Route path="/" element={<BookAppointmentPage />} />
              <Route path="/user" element={<UserDashboardPage />} />
              <Route path="/center-admin" element={<HealthcareCenterAdminDashboardPage />} />
              <Route path="/admin/slots" element={<SlotManagementPage />} />
              <Route path="/admin/bookings" element={<BookingManagementPage />} />
              <Route path="/system-admin" element={<SystemAdminDashboardPage />} />
              <Route path="/confirm" element={<BookingConfirmationPage />} />
              <Route path="/booking/:id" element={<BookingDetailsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
