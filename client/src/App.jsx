import { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import AppointmentsPage from "./pages/AppointmentsPage";
import UpdateResultsPage from "./pages/UpdateResultsPage";
import AddTestPage from "./pages/AddTestPage";

const navItems = [
  { to: "/", label: "Appointments", icon: "📋" },
  { to: "/update-results", label: "Update Results", icon: "🔬" },
  { to: "/add-test", label: "Add Test", icon: "➕" },
];

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-background">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed md:static z-40 h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="p-5 border-b border-sidebar-border">
            <h1 className="text-lg font-bold text-sidebar-primary-foreground tracking-tight">🏥 Lab Dashboard</h1>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5">Healthcare Diagnostics</p>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/50">Lab Technician Panel</p>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 bg-card border-b border-border flex items-center px-4 shrink-0">
            <button
              className="md:hidden mr-3 text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <span className="text-sm text-muted-foreground">Lab Technician Dashboard</span>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Routes>
              <Route path="/" element={<AppointmentsPage />} />
              <Route path="/update-results" element={<UpdateResultsPage />} />
              <Route path="/add-test" element={<AddTestPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
