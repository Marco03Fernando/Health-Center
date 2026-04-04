import { apiFetch } from "./api";

export async function loginUser(email: string, password: string) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data?.token) localStorage.setItem("token", data.token);
  if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));

  return data;
}

export async function logoutUser() {
  await apiFetch("/auth/logout", { method: "POST" });
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export async function getCurrentUser() {
  return apiFetch("/auth/me");
}

export async function updateCurrentUser(payload: Partial<{ name: string; email: string }>) {
  const data = await apiFetch("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));

  return data;
}
