import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

type AppointmentItem = {
  _id: string;
  status: string;
  note?: string;
  userId?: {
    _id?: string;
    fullName?: string;
    email?: string;
  };
  slotId?: {
    _id?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  };
};

type PrescriptionItem = {
  _id: string;
  appointmentId?: {
    _id?: string;
  } | string;
};

type PatientRow = {
  id: string;
  fullName: string;
  email: string;
  appointmentCount: number;
  lastDate: string;
  lastTime: string;
  status: string;
  lastAppointmentId?: string;
  hasPrescription: boolean;
};

function getArrayFromResponse(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.appointments)) return data.appointments;
  if (Array.isArray(data?.prescriptions)) return data.prescriptions;
  return [];
}

function getPrescriptionAppointmentId(item: PrescriptionItem) {
  if (!item?.appointmentId) return "";
  if (typeof item.appointmentId === "string") return item.appointmentId;
  return item.appointmentId?._id || "";
}

function canCreatePrescription(patient: PatientRow) {
  if (!patient.lastAppointmentId) return false;
  if (patient.hasPrescription) return false;
  if (patient.status === "completed") return false;
  if (patient.status === "cancelled") return false;
  if (patient.status === "no_show") return false;
  return true;
}

function canMarkAttendance(patient: PatientRow) {
  if (!patient.lastAppointmentId) return false;
  if (patient.status === "completed") return false;
  if (patient.status === "cancelled") return false;
  if (patient.status === "no_show") return false;
  if (patient.hasPrescription) return false;
  return true;
}

export default function Patients() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);

  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [medicineNames, setMedicineNames] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const [appointmentsRes, prescriptionsRes] = await Promise.all([
        apiFetch("/appointments/doctor/me"),
        apiFetch("/prescriptions/doctor/me"),
      ]);

      setAppointments(getArrayFromResponse(appointmentsRes));
      setPrescriptions(getArrayFromResponse(prescriptionsRes));
    } catch (err: any) {
      toast.error(err.message || "Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const prescriptionAppointmentIds = useMemo(() => {
    return new Set(
      prescriptions
        .map((item) => getPrescriptionAppointmentId(item))
        .filter(Boolean)
    );
  }, [prescriptions]);

  const patients = useMemo(() => {
    const map = new Map<string, PatientRow>();

    for (const appt of appointments) {
      const patientId = appt.userId?._id;
      if (!patientId) continue;

      const currentDate = appt.slotId?.date || "-";
      const currentTime = appt.slotId?.startTime || "-";
      const hasPrescription = prescriptionAppointmentIds.has(appt._id);

      const existing = map.get(patientId);

      if (!existing) {
        map.set(patientId, {
          id: patientId,
          fullName: appt.userId?.fullName || "Unknown Patient",
          email: appt.userId?.email || "-",
          appointmentCount: 1,
          lastDate: currentDate,
          lastTime: currentTime,
          status: appt.status || "-",
          lastAppointmentId: appt._id,
          hasPrescription,
        });
      } else {
        existing.appointmentCount += 1;

        const existingDateTime = `${existing.lastDate} ${existing.lastTime}`;
        const currentDateTime = `${currentDate} ${currentTime}`;

        if (currentDateTime > existingDateTime) {
          existing.lastDate = currentDate;
          existing.lastTime = currentTime;
          existing.status = appt.status || existing.status;
          existing.lastAppointmentId = appt._id;
          existing.hasPrescription = hasPrescription;
        }
      }
    }

    return Array.from(map.values());
  }, [appointments, prescriptionAppointmentIds]);

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;

    return patients.filter(
      (patient) =>
        patient.fullName.toLowerCase().includes(q) ||
        patient.email.toLowerCase().includes(q)
    );
  }, [patients, search]);

  const openPrescriptionModal = (patient: PatientRow) => {
    if (!canCreatePrescription(patient)) return;

    setSelectedPatient(patient);
    setDiagnosis("");
    setMedicineNames([""]);
  };

  const closePrescriptionModal = () => {
    if (submitting) return;
    setSelectedPatient(null);
    setDiagnosis("");
    setMedicineNames([""]);
  };

  const handleMedicineChange = (index: number, value: string) => {
    setMedicineNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addMedicineField = () => {
    setMedicineNames((prev) => [...prev, ""]);
  };

  const removeMedicineField = (index: number) => {
    setMedicineNames((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpdateAppointmentStatus = async (
    appointmentId: string,
    status: "completed" | "no_show"
  ) => {
    try {
      setStatusUpdatingId(appointmentId);

      await apiFetch(`/appointments/${appointmentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      toast.success(
        status === "no_show"
          ? "Appointment marked as no show"
          : "Appointment marked as completed"
      );

      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update appointment status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleCreatePrescription = async () => {
    if (!selectedPatient?.lastAppointmentId) {
      toast.error("No appointment found for this patient");
      return;
    }

    const cleanedMedicineItems = medicineNames
      .map((name) => name.trim())
      .filter(Boolean)
      .map((medicineName) => ({ medicineName }));

    if (!diagnosis.trim()) {
      toast.error("Diagnosis is required");
      return;
    }

    if (cleanedMedicineItems.length === 0) {
      toast.error("Add at least one medicine name");
      return;
    }

    try {
      setSubmitting(true);

      await apiFetch("/prescriptions", {
        method: "POST",
        body: JSON.stringify({
          appointmentId: selectedPatient.lastAppointmentId,
          diagnosis: diagnosis.trim(),
          items: cleanedMedicineItems,
        }),
      });

      toast.success("Prescription created successfully");
      closePrescriptionModal();
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create prescription");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading patients...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Users className="h-6 w-6 text-primary" />
            Patients
          </h1>
          <p className="text-muted-foreground">
            View patients from your booked appointments
          </p>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="rounded-lg border bg-muted p-6 text-center text-sm text-muted-foreground">
              No patients found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPatients.map((patient) => {
                const createAllowed = canCreatePrescription(patient);
                const attendanceAllowed = canMarkAttendance(patient);
                const isStatusUpdating = statusUpdatingId === patient.lastAppointmentId;

                return (
                  <div
                    key={patient.id}
                    className="flex flex-col gap-3 rounded-xl border p-4 xl:flex-row xl:items-center xl:justify-between"
                  >
                    <div className="space-y-1">
                      <h3 className="font-semibold">{patient.fullName}</h3>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Last Appointment: {patient.lastDate}{" "}
                        {patient.lastTime !== "-" ? `at ${patient.lastTime}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {patient.appointmentCount} Appointment
                        {patient.appointmentCount > 1 ? "s" : ""}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={
                          patient.status === "cancelled"
                            ? "text-xs border-destructive/30 bg-destructive/10 text-destructive"
                            : patient.status === "completed"
                            ? "text-xs border-green-500/30 bg-green-500/10 text-green-600"
                            : patient.status === "no_show"
                            ? "text-xs border-amber-500/30 bg-amber-500/10 text-amber-600"
                            : "text-xs border-primary/30 bg-primary/10 text-primary"
                        }
                      >
                        {patient.status}
                      </Badge>

                      {patient.hasPrescription ? (
                        <Badge
                          variant="outline"
                          className="text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        >
                          Prescription Created
                        </Badge>
                      ) : null}

                      {attendanceAllowed ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            onClick={() =>
                              patient.lastAppointmentId &&
                              handleUpdateAppointmentStatus(
                                patient.lastAppointmentId,
                                "no_show"
                              )
                            }
                            disabled={isStatusUpdating}
                          >
                            {isStatusUpdating ? "Updating..." : "No Show"}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            onClick={() =>
                              patient.lastAppointmentId &&
                              handleUpdateAppointmentStatus(
                                patient.lastAppointmentId,
                                "completed"
                              )
                            }
                            disabled={isStatusUpdating}
                          >
                            {isStatusUpdating ? "Updating..." : "Complete"}
                          </Button>
                        </>
                      ) : null}

                      {createAllowed ? (
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => openPrescriptionModal(patient)}
                        >
                          Create Prescription
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-background shadow-lg">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-lg font-semibold">Create Prescription</h2>
                <p className="text-sm text-muted-foreground">
                  Patient: {selectedPatient.fullName}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closePrescriptionModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Diagnosis</label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis"
                  className="min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Medicines</label>
                  <Button type="button" variant="outline" size="sm" onClick={addMedicineField}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Medicine
                  </Button>
                </div>

                {medicineNames.map((medicine, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={medicine}
                      onChange={(e) => handleMedicineChange(index, e.target.value)}
                      placeholder={`Medicine ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeMedicineField(index)}
                      disabled={medicineNames.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t p-4">
              <Button variant="outline" onClick={closePrescriptionModal} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleCreatePrescription} disabled={submitting}>
                {submitting ? "Saving..." : "Save Prescription"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}