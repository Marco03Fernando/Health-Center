import { apiFetch } from "./api";

export type AuthUser = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: "patient" | "doctor" | "receptionist" | "pharmacy";
  mustChangePassword: boolean;
  doctorProfileId?: string | null;
};

export async function loginUser(email: string, password: string) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutUser() {
  return apiFetch("/auth/logout", {
    method: "POST",
  });
}

export async function getCurrentUser(): Promise<{ user: AuthUser }> {
  return apiFetch("/auth/me");
}