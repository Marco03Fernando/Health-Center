import { labTechApiFetch as apiFetch } from "@/lib/api";


export type DiagnosticTest = {
  _id: string;
  name: string;
  description?: string;
  instructions?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TestType = {
  _id: string;
  testCode: string;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
  price: number;
  sampleTypes?: string;
  instructions?: string;
  parameters: {
    _id?: string;
    name: string;
    unit: string;
    normalMinValue: number;
    normalMaxValue: number;
  }[];
};

// ─── Diagnostic Tests

export async function getDiagnosticTests(centerId) {
  const qs = centerId ? `?centerId=${encodeURIComponent(centerId)}` : "";
  const res = await apiFetch(`/lab/diagnostic-tests${qs}`);
  return res?.data || (Array.isArray(res) ? res : []);
}

export async function createDiagnosticTest(data: any) {
  const isFormData = data instanceof FormData;

  const res = await apiFetch("/lab/diagnostic-tests", {
    method: "POST",
    body: isFormData ? data : JSON.stringify(data),
    headers: isFormData
      ? undefined // Let browser set multipart headers automatically
      : { "Content-Type": "application/json" },
  });

  return res?.data || res;
}

export async function updateDiagnosticTest(id, data) {
  const res = await apiFetch(`/lab/diagnostic-tests/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

export async function deleteDiagnosticTest(id) {
  await apiFetch(`/lab/diagnostic-tests/${id}`, {
    method: "DELETE",
  });
}

// Test Types 

// GET ALL (ACTIVE + INACTIVE)
export async function getTestTypes(centerId) {
  const qs = centerId ? `?centerId=${encodeURIComponent(centerId)}` : "";
  const res = await apiFetch(`/test-types${qs}`);
  return Array.isArray(res) ? res : res?.data || [];
}

// GET SINGLE
export async function getTestTypeById(id) {
  const res = await apiFetch(`/test-types/${id}`);
  return res?.data || res;
}

// CREATE
export async function createTestType(data) {
  const res = await apiFetch("/test-types", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

// UPDATE
export async function updateTestType(id, data) {
  const res = await apiFetch(`/test-types/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

// DELETE 
export async function deleteTestType(id) {
  await apiFetch(`/test-types/${id}`, {
    method: "DELETE",
  });
}

// ─── Lab Bookings ─────────────────────────────────────────────────────────────

export async function getLabBookings(centerId) {
  const res = await apiFetch(`/getappointments/${centerId}`);
  return res?.data || res?.appointments || (Array.isArray(res) ? res : []);
}

export async function getBookingById(bookingId) {
  const res = await apiFetch(`/appointment/${bookingId}`);
  return res?.data || res;
}

export async function updateBookingStatus(bookingId, status) {
  await apiFetch(`/updateappointment/${bookingId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

// ─── Test Results ─────────────────────────────────────────────────────────────

export async function getTestResults(centerId) {
  const qs = centerId ? `?centerId=${encodeURIComponent(centerId)}` : "";
  const res = await apiFetch(`/test-results${qs}`);
  return res?.data || (Array.isArray(res) ? res : []);
}

export async function createTestResult(data) {
  const res = await apiFetch("/test-results", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

export async function updateTestResult(id, data) {
  const res = await apiFetch(`/test-results/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

export async function sendTestResultWhatsApp(id) {
  const res = await apiFetch(`/test-results/${id}/send-whatsapp`, {
    method: "POST",
  });
  return res?.data || res;
}

// ─── Lab Bookings ─────────────────────────────────────────────────────────────

// GET ALL BOOKINGS
export async function getAllLabBookings() {
  const res = await apiFetch(`/getallappointments`);
  return res?.data || (Array.isArray(res) ? res : []);
}

// PDF opening function

export function openTestResultPdf(resultId) {
  const baseUrl =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8081/api";

  window.open(`${baseUrl}/test-results/${resultId}/pdf`, "_blank");
}