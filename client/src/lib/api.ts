import { API_BASE_URL } from "@/config/api";

/**
 * Core fetch utility shared across all portals.
 * Automatically attaches the appropriate Bearer token when present.
 *
 * Token resolution order:
 *  1. `admin_token` – set by the admin portal login
 *  2. `token`       – set by the patient portal login
 *  3. Omitted (cookie-only) – used by the doctor portal
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token =
    localStorage.getItem("admin_token") || localStorage.getItem("token") || null;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
}
