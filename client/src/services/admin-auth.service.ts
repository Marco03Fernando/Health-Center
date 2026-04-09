import { apiFetch } from "@/lib/api";
import type { AdminUser } from "@/types";

export async function adminLogin(email: string, password: string) {
  const data = await apiFetch("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data?.token) {
    localStorage.setItem("admin_token", data.token);
  }

  return data;
}

export async function adminGetCurrentUser(): Promise<{ admin?: AdminUser; user?: AdminUser }> {
  return apiFetch("/admin/auth/me");
}

export async function adminLogout() {
  try {
    await apiFetch("/admin/auth/logout", { method: "POST" });
  } catch {
    // ignore backend logout errors
  } finally {
    localStorage.removeItem("admin_token");
  }
}
