import { createContext, useContext, useEffect, useMemo, useState, } from "react";
import { apiFetch } from "@/lib/api";
const CenterAdminContext = createContext(null);
export const useCenterAdmin = () => {
    const ctx = useContext(CenterAdminContext);
    if (!ctx)
        throw new Error("useCenterAdmin must be used within CenterAdminProvider");
    return ctx;
};
function normalizeCenterAdmin(data) {
    const u = data?.admin || data?.user || data;
    if (!u)
        return null;
    // Reject lab-tech accounts — they belong to the lab-tech portal only
    if (u.role === "lab-tech")
        return null;
    return {
        id: u.id || u._id || "",
        name: u.name || u.fullName || "",
        email: u.email || "",
        role: u.role || "",
        centerId: u.centerId || "",
        centerName: u.centerName || "",
    };
}
export function CenterAdminProvider({ children }) {
    const [admin, setAdmin] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const refreshAuth = async () => {
        try {
            const data = await apiFetch("/admin/auth/me");
            setAdmin(normalizeCenterAdmin(data));
        }
        catch {
            setAdmin(null);
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        refreshAuth();
    }, []);
    const login = async (email, password) => {
        try {
            const data = await apiFetch("/admin/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            if (data?.token)
                localStorage.setItem("admin_token", data.token);
            const normalized = normalizeCenterAdmin(data);
            if (!normalized) {
                setAdmin(null);
                return false;
            }
            setAdmin(normalized);
            return true;
        }
        catch {
            setAdmin(null);
            return false;
        }
    };
    const logout = async () => {
        try {
            await apiFetch("/auth/logout", { method: "POST" });
        }
        catch { /* ignore */ }
        finally {
            localStorage.removeItem("admin_token");
            setAdmin(null);
        }
    };
    const centerId = admin?.centerId || "";
    const centerName = admin?.centerName || "";
    const value = useMemo(() => ({ admin, centerId, centerName, isAuthenticated: !!admin, isLoading, login, logout, refreshAuth }), [admin, isLoading]);
    return (<CenterAdminContext.Provider value={value}>
      {children}
    </CenterAdminContext.Provider>);
}
