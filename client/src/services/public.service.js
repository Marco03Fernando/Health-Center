import { API_BASE_URL } from "@/config/api";

/**
 * Public API helpers — no auth token required.
 * These endpoints are open on the backend.
 */

/**
 * Fetch paginated doctors list.
 * @param {{ specialization?: string, q?: string, page?: number, limit?: number }} params
 * @returns {{ items: object[], pagination: object }}
 */
export async function fetchDoctors(params = {}) {
  const query = new URLSearchParams();
  if (params.specialization) query.set("specialization", params.specialization);
  if (params.q) query.set("q", params.q);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  const res = await fetch(`${API_BASE_URL}/doctors${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(`Failed to load doctors (${res.status})`);
  return res.json(); // { items, pagination }
}

/**
 * Fetch all active lab / diagnostic tests.
 * @param {{ category?: string }} params
 * @returns {{ success: boolean, count: number, data: object[] }}
 */
export async function fetchLabTests(params = {}) {
  const query = new URLSearchParams();
  if (params.centerId) query.set("centerId", params.centerId);

  const qs = query.toString();
  const res = await fetch(
    `${API_BASE_URL}/lab/diagnostic-tests${qs ? `?${qs}` : ""}`
  );
  if (!res.ok) throw new Error(`Failed to load lab tests (${res.status})`);
  return res.json(); // { success, count, data }
}
