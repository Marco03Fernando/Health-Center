import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { getCurrentUser, loginUser, logoutUser } from "@/lib/auth";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: "admin" | "superadmin";
  isActive?: boolean;
}

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Admin>) => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const normalizeAdmin = (data: any): Admin | null => {
    const adminData = data?.admin || data?.user || data;

    if (!adminData) return null;

    if (adminData.role !== "admin" && adminData.role !== "superadmin") {
      return null;
    }

    return {
      id: adminData.id || adminData._id || "",
      name: adminData.name || "",
      email: adminData.email || "",
      role: adminData.role,
      isActive: adminData.isActive ?? true,
    };
  };

  const refreshAuth = async () => {
    try {
      const data = await getCurrentUser();
      const normalized = normalizeAdmin(data);
      setAdmin(normalized);
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
      const data = await loginUser(email, password);
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
      await logoutUser();
    } catch {
      // ignore logout API errors
    } finally {
      setAdmin(null);
    }
  };

  const updateProfile = (data: Partial<Admin>) => {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}