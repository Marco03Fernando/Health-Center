import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  adminGetCurrentUser,
  adminLogin,
  adminLogout,
} from "@/services/admin-auth.service";

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
};

function normalizeAdmin(data) {
  const adminData = data?.admin || data?.user || data;
  if (!adminData) return null;
  if (adminData.role !== "admin" && adminData.role !== "superadmin") return null;

  return {
    id: adminData.id || adminData._id || "",
    name: adminData.name || "",
    email: adminData.email || "",
    role: adminData.role,
    isActive: adminData.isActive ?? true,
  };
}

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = async () => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      setAdmin(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await adminGetCurrentUser();
      setAdmin(normalizeAdmin(data));
    } catch {
      setAdmin(null);
      localStorage.removeItem("admin_token");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await adminLogin(email, password);
      const normalized = normalizeAdmin(data);

      if (!normalized) {
        setAdmin(null);
        return false;
      }

      setAdmin(normalized);
      return true;
    } catch {
      setAdmin(null);
      return false;
    }
  };

  const logout = async () => {
    try {
      await adminLogout();
    } catch {
      // even if backend logout fails, clear client auth
    } finally {
      setAdmin(null);
      localStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_token");
    }
  };

  const updateProfile = (data) => {
    setAdmin((prev) => (prev ? { ...prev, ...data } : null));
  };

  const value = useMemo(
    () => ({
      admin,
      isAuthenticated: !!admin,
      isLoading,
      login,
      logout,
      updateProfile,
      refreshAuth,
    }),
    [admin, isLoading]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}