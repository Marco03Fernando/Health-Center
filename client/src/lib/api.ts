import { API_BASE_URL } from "@/config/api";

function buildApiUrl(endpoint: string) {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const finalEndpoint = normalizedEndpoint.startsWith("/api")
    ? normalizedEndpoint
    : `/api${normalizedEndpoint}`;

  return `${API_BASE_URL}${finalEndpoint}`;
}

function parseResponseSafe(response: Response) {
  return response
    .json()
    .catch(() => null);
}

function buildHeaders(tokenKey: string | null, headers?: HeadersInit) {
  const token = tokenKey ? localStorage.getItem(tokenKey) : null;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers || {}),
  };
}

/**
 * Generic fetch utility kept for backwards compatibility.
 * Current behavior preserved:
 *  1. admin_token
 *  2. token
 *  3. cookie-only
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

  const data = await parseResponseSafe(response);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
}

/**
 * User/patient portal fetch.
 * ONLY reads `token`.
 */
export async function userApiFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(buildApiUrl(endpoint), {
    ...options,
    credentials: "include",
    headers: buildHeaders("token", options.headers),
  });

  const data = await parseResponseSafe(response);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
}

/**
 * Admin / center-admin portal fetch.
 * ONLY reads `admin_token`.
 */
export async function adminApiFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(buildApiUrl(endpoint), {
    ...options,
    credentials: "include",
    headers: buildHeaders("admin_token", options.headers),
  });

  const data = await parseResponseSafe(response);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
}

/**
 * Isolated fetch for the Lab Technician portal.
 * ONLY reads `lab_tech_token`.
 */
export async function labTechApiFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(buildApiUrl(endpoint), {
    ...options,
    credentials: "include",
    headers: buildHeaders("lab_tech_token", options.headers),
  });

  const data = await parseResponseSafe(response);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
}

/**
 * Isolated fetch for the Pharmacy portal.
 * ONLY reads `pharmacy_token`.
 */
export async function pharmacyApiFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(buildApiUrl(endpoint), {
    ...options,
    credentials: "include",
    headers: buildHeaders("pharmacy_token", options.headers),
  });

  const data = await parseResponseSafe(response);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
}