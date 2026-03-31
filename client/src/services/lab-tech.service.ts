import { labTechApiFetch as apiFetch } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

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

export type BookingStatus = "CONFIRMED" | "COMPLETED" | "CANCELLED";

export type LabBooking = {
  _id: string;
  appointmentStatus: BookingStatus;
  appointmentDate?: string;
  diagnosticTest?: {
    _id?: string;
    name?: string;
    description?: string;
    instructions?: string;
  } | null;
  healthCenter?: {
    _id?: string;
    name?: string;
    address?: string;
    phone?: string;
  } | null;
  slot?: {
    _id?: string;
    slotDate?: string;
    startTime?: string;
    endTime?: string;
  } | null;
  user?: {
    _id?: string;
    fullName?: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
};

export type TestResult = {
  _id: string;
  appointmentId: string;
  testTypeId: string | TestType;
  patientId?: string;
  doctorId?: string;
  status: "pending" | "undergoing" | "completed";
  condition?: "normal" | "severe" | "unknown";
  results: {
    name: string;
    value: number;
    unit: string;
    normalMinValue?: number;
    normalMaxValue?: number;
  }[];
  notes?: string;
  recommendConsultation?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// ─── Diagnostic Tests ─────────────────────────────────────────────────────────

export async function getDiagnosticTests(): Promise<DiagnosticTest[]> {
  const res = await apiFetch("/lab/diagnostic-tests");
  return res?.data || (Array.isArray(res) ? res : []);
}

export async function createDiagnosticTest(data: {
  name: string;
  description?: string;
  instructions: string;
  isActive?: boolean;
}): Promise<DiagnosticTest> {
  const res = await apiFetch("/lab/diagnostic-tests", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

export async function updateDiagnosticTest(
  id: string,
  data: Partial<{ name: string; description: string; instructions: string; isActive: boolean }>
): Promise<DiagnosticTest> {
  const res = await apiFetch(`/lab/diagnostic-tests/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

export async function deleteDiagnosticTest(id: string): Promise<void> {
  await apiFetch(`/lab/diagnostic-tests/${id}`, { method: "DELETE" });
}

// ─── Test Types (for result entry parameters) ─────────────────────────────────

export async function getTestTypes(): Promise<TestType[]> {
  const res = await apiFetch("/test-types");
  return Array.isArray(res) ? res : res?.data || [];
}

export async function getTestTypeById(id: string): Promise<TestType> {
  const res = await apiFetch(`/test-types/${id}`);
  return res?.data || res;
}

// ─── Lab Bookings ─────────────────────────────────────────────────────────────

export async function getLabBookings(centerId: string): Promise<LabBooking[]> {
  const res = await apiFetch(`/getappointments/${centerId}`);
  return res?.data || res?.appointments || (Array.isArray(res) ? res : []);
}

export async function getBookingById(bookingId: string): Promise<LabBooking> {
  const res = await apiFetch(`/appointment/${bookingId}`);
  return res?.data || res;
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  await apiFetch(`/updateappointment/${bookingId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

// ─── Test Results ─────────────────────────────────────────────────────────────

export async function getTestResults(): Promise<TestResult[]> {
  const res = await apiFetch("/test-results");
  return res?.data || (Array.isArray(res) ? res : []);
}

export async function createTestResult(data: {
  appointmentId: string;
  testTypeId: string;
  patientId?: string;
  status?: string;
  condition?: string;
  results: { name: string; value: number; unit: string; normalMinValue?: number; normalMaxValue?: number }[];
  notes?: string;
  recommendConsultation?: boolean;
}): Promise<TestResult> {
  const res = await apiFetch("/test-results", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

export async function updateTestResult(
  id: string,
  data: Partial<TestResult>
): Promise<TestResult> {
  const res = await apiFetch(`/test-results/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}
