import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { apiFetch } from "@/lib/api";

const CenterAdminContext = createContext(null);

export const useCenterAdmin = () => {
  const ctx = useContext(CenterAdminContext);
  if (!ctx) {
    throw new Error("useCenterAdmin must be used within CenterAdminProvider");
  }
  return ctx;
};

function normalizeCenterAdmin(data) {
  const u = data?.admin || data?.user || data;
  if (!u) return null;

  const role = String(u.role || "").toLowerCase();

  if (role !== "center-admin") return null;

  return {
    id: u.id || u._id || "",
    name: u.name || u.fullName || "",
    email: u.email || "",
    role: u.role || "",
    centerId: u.centerId || "",
    centerName: u.centerName || "",
    centerAddress: u.centerAddress || "",
    centerDistrict: u.centerDistrict || "",
    centerOpeningTime: u.centerOpeningTime || "",
    centerClosingTime: u.centerClosingTime || "",
  };
}

export function CenterAdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        setAdmin(null);
        return;
      }

      const data = await apiFetch("/admin/auth/me");
      const normalized = normalizeCenterAdmin(data);

      if (!normalized) {
        localStorage.removeItem("admin_token");
        setAdmin(null);
        return;
      }

      setAdmin(normalized);
    } catch {
      localStorage.removeItem("admin_token");
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (email, password) => {
    try {
      const data = await apiFetch("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (data?.token) {
        localStorage.setItem("admin_token", data.token);
      }

      const normalized = normalizeCenterAdmin(data);

      if (!normalized) {
        localStorage.removeItem("admin_token");
        setAdmin(null);
        window.dispatchEvent(new Event("auth-changed"));
        return false;
      }

      setAdmin(normalized);
      window.dispatchEvent(new Event("auth-changed"));
      return true;
    } catch {
      localStorage.removeItem("admin_token");
      setAdmin(null);
      window.dispatchEvent(new Event("auth-changed"));
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiFetch("/admin/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    } finally {
      localStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_token");
      setAdmin(null);
      window.dispatchEvent(new Event("auth-changed"));
      window.location.replace("/");
    }
  };

  const centerId = admin?.centerId || "";
  const centerName = admin?.centerName || "";

  const value = useMemo(
    () => ({
      admin,
      centerId,
      centerName,
      isAuthenticated: !!admin,
      isLoading,
      login,
      logout,
      refreshAuth,
    }),
    [admin, isLoading, refreshAuth]
  );

  return (
    <CenterAdminContext.Provider value={value}>
      {children}
    </CenterAdminContext.Provider>
  );
}