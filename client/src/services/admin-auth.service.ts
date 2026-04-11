import { adminApiFetch } from "@/lib/api";
import type { AdminUser } from "@/types";

export async function adminLogin(email: string, password: string) {
  const data = await adminApiFetch("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data?.token) {
    localStorage.setItem("admin_token", data.token);
  }

  return data;
}

export async function adminGetCurrentUser(): Promise<{ admin?: AdminUser; user?: AdminUser }> {
  return adminApiFetch("/admin/auth/me");
}

export async function adminLogout() {
  try {
    await adminApiFetch("/admin/auth/logout", { method: "POST" });
  } catch {
    // ignore backend logout errors
  } finally {
    localStorage.removeItem("admin_token");
  }
}