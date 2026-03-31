import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";

export type CenterAdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  centerId?: string;
  centerName?: string;
};

interface CenterAdminContextType {
  admin: CenterAdminUser | null;
  centerId: string;
  centerName: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const CenterAdminContext = createContext<CenterAdminContextType | null>(null);

export const useCenterAdmin = () => {
  const ctx = useContext(CenterAdminContext);
  if (!ctx) throw new Error("useCenterAdmin must be used within CenterAdminProvider");
  return ctx;
};

function normalizeCenterAdmin(data: any): CenterAdminUser | null {
  const u = data?.admin || data?.user || data;
  if (!u) return null;
  // Reject lab-tech accounts — they belong to the lab-tech portal only
  if (u.role === "lab-tech") return null;
  return {
    id: u.id || u._id || "",
    name: u.name || u.fullName || "",
    email: u.email || "",
    role: u.role || "",
    centerId: u.centerId || "",
    centerName: u.centerName || "",
  };
}

export function CenterAdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<CenterAdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      const data = await apiFetch("/admin/auth/me");
      setAdmin(normalizeCenterAdmin(data));
    } catch {
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await apiFetch("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data?.token) localStorage.setItem("admin_token", data.token);
      const normalized = normalizeCenterAdmin(data);
      if (!normalized) { setAdmin(null); return false; }
      setAdmin(normalized);
      return true;
    } catch {
      setAdmin(null);
      return false;
    }
  };

  const logout = async () => {
    try { await apiFetch("/auth/logout", { method: "POST" }); } catch { /* ignore */ }
    finally {
      localStorage.removeItem("admin_token");
      setAdmin(null);
    }
  };

  const centerId = admin?.centerId || "";
  const centerName = admin?.centerName || "";

  const value = useMemo(
    () => ({ admin, centerId, centerName, isAuthenticated: !!admin, isLoading, login, logout, refreshAuth }),
    [admin, isLoading]
  );

  return (
    <CenterAdminContext.Provider value={value}>
      {children}
    </CenterAdminContext.Provider>
  );
}
