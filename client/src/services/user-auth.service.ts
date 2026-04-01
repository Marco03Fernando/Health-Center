import { apiFetch } from "@/lib/api";
import type { AuthUser } from "@/types";

export async function userLogin(email: string, password: string) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data?.token) {
    localStorage.setItem("token", data.token);
  }

  return data;
}

export async function userRegister(payload: {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function userLogout() {
  const data = await apiFetch("/auth/logout", { method: "POST" });
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  return data;
}

export async function userGetCurrentUser(): Promise<{ user: AuthUser }> {
  return apiFetch("/auth/me");
}
