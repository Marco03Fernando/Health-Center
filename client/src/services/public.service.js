import { apiFetch } from "@/lib/api";

/**
 * Public API helpers
 */

/**
 * Fetch paginated doctors list.
 * @param {{ specialization?: string, q?: string, page?: number, limit?: number }} params
 * @returns {Promise<any>}
 */
export async function fetchDoctors(params = {}) {
  const query = new URLSearchParams();

  if (params.specialization) query.set("specialization", params.specialization);
  if (params.q) query.set("q", params.q);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();

  return apiFetch(`/doctors${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}

/**
 * Fetch all active lab / diagnostic tests.
 * @param {{ centerId?: string }} params
 * @returns {Promise<any>}
 */
export async function fetchLabTests(params = {}) {
  const query = new URLSearchParams();

  if (params.centerId) query.set("centerId", params.centerId);

  const qs = query.toString();

  return apiFetch(`/lab/diagnostic-tests${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}