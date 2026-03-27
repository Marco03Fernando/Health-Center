import { apiFetch } from "./api";

export async function loginUser(email: string, password: string) {
  const data = await apiFetch("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data?.token) {
    localStorage.setItem("admin_token", data.token);
  }

  return data;
}

export async function getCurrentUser() {
  return apiFetch("/admin/auth/me", {
    method: "GET",
  });
}

export async function logoutUser() {
  try {
    await apiFetch("/auth/logout", {
      method: "POST",
    });
  } catch {
    // ignore backend logout errors
  } finally {
    localStorage.removeItem("admin_token");
  }
}