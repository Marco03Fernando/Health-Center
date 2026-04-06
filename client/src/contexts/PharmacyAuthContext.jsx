import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  pharmacyGetCurrentUser,
  pharmacyLogin,
  pharmacyLogout,
  pharmacyUpdateCurrentUser,
} from "@/services/pharmacy-auth.service";

const PharmacyAuthContext = createContext(null);

export const usePharmacyAuth = () => {
  const ctx = useContext(PharmacyAuthContext);
  if (!ctx) throw new Error("usePharmacyAuth must be used within PharmacyAuthProvider");
  return ctx;
};

function normalizePharmacist(data) {
  const user = data?.user || data?.admin || data;
  if (!user) return null;

  const role = user.role;
  if (role !== "pharmacy" && role !== "pharmacist" && role !== "PHARMACIST") return null;

  return {
    id: user.id || user._id || "",
    name: user.name || user.fullName || "",
    email: user.email || "",
    role: user.role,
    isActive: user.isActive ?? true,
  };
}

export function PharmacyAuthProvider({ children }) {
  const [pharmacist, setPharmacist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      const data = await pharmacyGetCurrentUser();
      setPharmacist(normalizePharmacist(data));
    } catch {
      setPharmacist(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await pharmacyLogin(email, password);
      const normalized = normalizePharmacist(data);
      if (!normalized) {
        setPharmacist(null);
        return false;
      }
      setPharmacist(normalized);
      return true;
    } catch {
      setPharmacist(null);
      return false;
    }
  };

  const logout = async () => {
    try {
      await pharmacyLogout();
    } catch {
      /* ignore */
    } finally {
      setPharmacist(null);
    }
  };

  const updateProfile = (data) => {
    setPharmacist((prev) => (prev ? { ...prev, ...data } : null));
  };

  const value = useMemo(
    () => ({
      pharmacist,
      isAuthenticated: !!pharmacist,
      isLoading,
      login,
      logout,
      updateProfile,
      refreshAuth,
      pharmacyUpdateCurrentUser,
    }),
    [pharmacist, isLoading]
  );

  return (
    <PharmacyAuthContext.Provider value={value}>
      {children}
    </PharmacyAuthContext.Provider>
  );
}
