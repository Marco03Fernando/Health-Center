import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import {
  pharmacyGetCurrentUser,
  pharmacyLogin,
  pharmacyLogout,
  pharmacyUpdateCurrentUser,
} from "@/services/pharmacy-auth.service";

const PharmacyAuthContext = createContext(null);

export const usePharmacyAuth = () => {
  const ctx = useContext(PharmacyAuthContext);
  if (!ctx) {
    throw new Error("usePharmacyAuth must be used within PharmacyAuthProvider");
  }
  return ctx;
};

function normalizePharmacist(data) {
  const user = data?.user || data?.admin || data;
  if (!user) return null;

  const role = String(user.role || "").toLowerCase();
  if (role !== "pharmacy" && role !== "pharmacist") return null;

  return {
    id: user.id || user._id || "",
    name: user.name || user.fullName || "",
    email: user.email || "",
    role: user.role,
    isActive: user.isActive ?? true,
    centerName: user.centerName || "",
  };
}

function clearPharmacyAuthStorage() {
  const keys = [
    "pharmacy_token",
    "pharmacy_user",
    "token",
    "user",
  ];

  keys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

function notifyAuthChanged() {
  window.dispatchEvent(new Event("auth-changed"));
}

export function PharmacyAuthProvider({ children }) {
  const [pharmacist, setPharmacist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearClientAuth = useCallback(() => {
    clearPharmacyAuthStorage();
    setPharmacist(null);
  }, []);

  const refreshAuth = useCallback(async ({ showLoader = true } = {}) => {
    if (showLoader) setIsLoading(true);

    try {
      const data = await pharmacyGetCurrentUser();
      const normalized = normalizePharmacist(data);

      if (!normalized) {
        clearClientAuth();
        return null;
      }

      setPharmacist(normalized);
      return normalized;
    } catch {
      clearClientAuth();
      return null;
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [clearClientAuth]);

  useEffect(() => {
    refreshAuth({ showLoader: true });
  }, [refreshAuth]);

  useEffect(() => {
    const revalidateAuth = () => {
      refreshAuth({ showLoader: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        revalidateAuth();
      }
    };

    const handlePageShow = () => {
      revalidateAuth();
    };

    window.addEventListener("focus", revalidateAuth);
    window.addEventListener("storage", revalidateAuth);
    window.addEventListener("auth-changed", revalidateAuth);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", revalidateAuth);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", revalidateAuth);
      window.removeEventListener("storage", revalidateAuth);
      window.removeEventListener("auth-changed", revalidateAuth);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", revalidateAuth);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshAuth]);

  const login = async (email, password) => {
    setIsLoading(true);

    try {
      const data = await pharmacyLogin(email, password);
      const normalized = normalizePharmacist(data);

      if (!normalized) {
        clearClientAuth();
        notifyAuthChanged();
        return false;
      }

      setPharmacist(normalized);
      notifyAuthChanged();
      return true;
    } catch {
      clearClientAuth();
      notifyAuthChanged();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      await pharmacyLogout();
    } catch {
      // ignore logout API errors, but still clear client auth
    } finally {
      clearClientAuth();
      notifyAuthChanged();
      setIsLoading(false);
    }
  };

  const updateProfile = (data) => {
    setPharmacist((prev) => (prev ? { ...prev, ...data } : null));
    notifyAuthChanged();
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
    [pharmacist, isLoading, refreshAuth]
  );

  return (
    <PharmacyAuthContext.Provider value={value}>
      {children}
    </PharmacyAuthContext.Provider>
  );
}