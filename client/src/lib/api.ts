import { API_BASE_URL } from "@/config/api";

function buildApiUrl(endpoint: string) {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // If endpoint already starts with /api, keep it as-is
  const finalEndpoint = normalizedEndpoint.startsWith("/api")
    ? normalizedEndpoint
    : `/api${normalizedEndpoint}`;

  return `${API_BASE_URL}${finalEndpoint}`;
}

/**
 * Core fetch utility shared across all portals.
 * Automatically attaches the appropriate Bearer token when present.
 *
 * Token resolution order:
 *  1. `admin_token` – set by the admin / center-admin portal login
 *  2. `token`       – set by the patient portal login
 *  3. Omitted (cookie-only) – used by the doctor portal
 *
 * NOTE: lab_tech_token is intentionally excluded here.
 * Use `labTechApiFetch` for all lab-tech portal requests.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token =
    localStorage.getItem("admin_token") ||
    localStorage.getItem("token") ||
    null;

  const response = await fetch(buildApiUrl(endpoint), {
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

/**
 * Isolated fetch for the Lab Technician portal.
 * ONLY reads `lab_tech_token` — never picks up admin_token or any other
 * portal's credentials, preventing cross-portal authentication bleed.
 */
export async function labTechApiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("lab_tech_token") || null;

  const response = await fetch(buildApiUrl(endpoint), {
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

/**
 * Isolated fetch for the Pharmacy portal.
 * ONLY reads `pharmacy_token` — never picks up other portals' credentials.
 */
export async function pharmacyApiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("pharmacy_token") || null;

  const response = await fetch(buildApiUrl(endpoint), {
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