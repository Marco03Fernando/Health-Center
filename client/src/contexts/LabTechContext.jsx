import { createContext, useContext, useEffect, useMemo, useState, } from "react";
import { labTechApiFetch } from "@/lib/api";
const LabTechContext = createContext(null);
export const useLabTech = () => {
    const ctx = useContext(LabTechContext);
    if (!ctx)
        throw new Error("useLabTech must be used within LabTechProvider");
    return ctx;
};
function normalizeUser(data) {
    const u = data?.admin || data?.user || data;
    if (!u)
        return null;
    // Only accept accounts that carry the lab-tech role
    if (u.role !== "lab-tech")
        return null;
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
    const refreshAuth = async () => {
        try {
            const data = await labTechApiFetch("/admin/auth/me");
            setUser(normalizeUser(data));
        }
        catch {
            setUser(null);
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
            // Clear any stale admin token so it cannot bleed into this portal's fetch
            localStorage.removeItem("admin_token");
            const data = await labTechApiFetch("/admin/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            if (data?.token)
                localStorage.setItem("lab_tech_token", data.token);
            const normalized = normalizeUser(data);
            if (!normalized) {
                setUser(null);
                return false;
            }
            setUser(normalized);
            return true;
        }
        catch {
            setUser(null);
            return false;
        }
    };
    const logout = async () => {
        try {
            await labTechApiFetch("/auth/logout", { method: "POST" });
        }
        catch {
            /* ignore */
        }
        finally {
            localStorage.removeItem("lab_tech_token");
            setUser(null);
        }
    };
    const centerId = user?.centerId || "";
    const centerName = user?.centerName || "";
    const centerAddress = user?.centerAddress || "";
    const centerDistrict = user?.centerDistrict || "";
    const value = useMemo(() => ({
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
    }), [user, isLoading]);
    return (<LabTechContext.Provider value={value}>{children}</LabTechContext.Provider>);
}
