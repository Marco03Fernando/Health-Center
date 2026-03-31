import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { adminGetCurrentUser, adminLogin, adminLogout } from "@/services/admin-auth.service";
import type { AdminUser } from "@/types";

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AdminUser>) => void;
  refreshAuth: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
};

function normalizeAdmin(data: any): AdminUser | null {
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

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      const data = await adminGetCurrentUser();
      setAdmin(normalizeAdmin(data));
    } catch {
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await adminLogin(email, password);
      const normalized = normalizeAdmin(data);
      if (!normalized) { setAdmin(null); return false; }
      setAdmin(normalized);
      return true;
    } catch {
      setAdmin(null);
      return false;
    }
  };

  const logout = async () => {
    try { await adminLogout(); } catch { /* ignore */ }
    finally { setAdmin(null); }
  };

  const updateProfile = (data: Partial<AdminUser>) => {
    setAdmin((prev) => (prev ? { ...prev, ...data } : null));
  };

  const value = useMemo(
    () => ({ admin, isAuthenticated: !!admin, isLoading, login, logout, updateProfile, refreshAuth }),
    [admin, isLoading]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
