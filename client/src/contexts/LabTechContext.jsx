import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { labTechApiFetch } from "@/lib/api";

const LabTechContext = createContext(null);

export const useLabTech = () => {
  const ctx = useContext(LabTechContext);
  if (!ctx) throw new Error("useLabTech must be used within LabTechProvider");
  return ctx;
};

function normalizeUser(data) {
  const u = data?.admin || data?.user || data;
  if (!u) return null;

  if (u.role !== "lab-tech") return null;

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

export function LabTechProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("lab_tech_token");

      if (!token) {
        setUser(null);
        return;
      }

      const data = await labTechApiFetch("/admin/auth/me");
      const normalized = normalizeUser(data);

      if (!normalized) {
        localStorage.removeItem("lab_tech_token");
        setUser(null);
        return;
      }

      setUser(normalized);
    } catch {
      localStorage.removeItem("lab_tech_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (email, password) => {
    try {
      localStorage.removeItem("admin_token");

      const data = await labTechApiFetch("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (data?.token) {
        localStorage.setItem("lab_tech_token", data.token);
      }

      const normalized = normalizeUser(data);

      if (!normalized) {
        localStorage.removeItem("lab_tech_token");
        setUser(null);
        window.dispatchEvent(new Event("auth-changed"));
        return false;
      }

      setUser(normalized);
      window.dispatchEvent(new Event("auth-changed"));
      return true;
    } catch {
      localStorage.removeItem("lab_tech_token");
      setUser(null);
      window.dispatchEvent(new Event("auth-changed"));
      return false;
    }
  };

  const logout = async () => {
    try {
      await labTechApiFetch("/admin/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    } finally {
      localStorage.removeItem("lab_tech_token");
      sessionStorage.removeItem("lab_tech_token");
      setUser(null);
      window.dispatchEvent(new Event("auth-changed"));
      window.location.replace("/");
    }
  };

  const centerId = user?.centerId || "";
  const centerName = user?.centerName || "";
  const centerAddress = user?.centerAddress || "";
  const centerDistrict = user?.centerDistrict || "";

  const value = useMemo(
    () => ({
      user,
      centerId,
      centerName,
      centerAddress,
      centerDistrict,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshAuth,
    }),
    [user, isLoading, refreshAuth]
  );

  return <LabTechContext.Provider value={value}>{children}</LabTechContext.Provider>;
}