import { apiFetch } from "@/lib/api";
import type { AuthUser } from "@/types";

export async function doctorLogin(email: string, password: string) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function doctorLogout() {
  return apiFetch("/auth/logout", { method: "POST" });
}

export async function doctorGetCurrentUser(): Promise<{ user: AuthUser }> {
  return apiFetch(`/auth/me?_=${Date.now()}`);
}