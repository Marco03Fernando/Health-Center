import { pharmacyApiFetch } from "@/lib/api";

export async function pharmacyLogin(email, password) {
  const data = await pharmacyApiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data?.token) localStorage.setItem("pharmacy_token", data.token);
  if (data?.user) localStorage.setItem("pharmacy_user", JSON.stringify(data.user));

  return data;
}

export async function pharmacyLogout() {
  try {
    await pharmacyApiFetch("/auth/logout", { method: "POST" });
  } catch {
    // ignore logout API errors
  } finally {
    localStorage.removeItem("pharmacy_token");
    localStorage.removeItem("pharmacy_user");
  }
}

export async function pharmacyGetCurrentUser() {
  return pharmacyApiFetch("/auth/me");
}

export async function pharmacyUpdateCurrentUser(payload) {
  const data = await pharmacyApiFetch("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (data?.user) localStorage.setItem("pharmacy_user", JSON.stringify(data.user));

  return data;
}