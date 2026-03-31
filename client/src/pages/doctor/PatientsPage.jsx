import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, Plus, X, UserRound, Mail, CalendarDays, FileText, Loader2, ClipboardCheck, CircleOff, Pill, } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
function getArrayFromResponse(data) {
    if (Array.isArray(data))
        return data;
    if (Array.isArray(data?.data))
        return data.data;
    if (Array.isArray(data?.items))
        return data.items;
    if (Array.isArray(data?.appointments))
        return data.appointments;
    if (Array.isArray(data?.prescriptions))
        return data.prescriptions;
    return [];
}
function getPrescriptionAppointmentId(item) {
    if (!item?.appointmentId)
        return "";
    if (typeof item.appointmentId === "string")
        return item.appointmentId;
    return item.appointmentId?._id || "";
}
function canCreatePrescription(patient) {
    if (!patient.lastAppointmentId)
        return false;
    if (patient.hasPrescription)
        return false;
    if (patient.status === "completed")
        return false;
    if (patient.status === "cancelled")
        return false;
    if (patient.status === "no_show")
        return false;
    return true;
}
function canMarkAttendance(patient) {
    if (!patient.lastAppointmentId)
        return false;
    if (patient.status === "completed")
        return false;
    if (patient.status === "cancelled")
        return false;
    if (patient.status === "no_show")
        return false;
    if (patient.hasPrescription)
        return false;
    return true;
}
function getStatusClass(status) {
    if (status === "cancelled") {
        return "border-destructive/30 bg-destructive/10 text-destructive";
    }
    if (status === "completed") {
        return "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400";
    }
    if (status === "no_show") {
        return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    }
    return "border-primary/30 bg-primary/10 text-primary";
}
export default function Patients() {
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [appointments, setAppointments] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [diagnosis, setDiagnosis] = useState("");
    const [medicineNames, setMedicineNames] = useState([""]);
    const [submitting, setSubmitting] = useState(false);
    const [statusUpdatingId, setStatusUpdatingId] = useState(null);
    const loadData = async () => {
        try {
            setLoading(true);
            const [appointmentsRes, prescriptionsRes] = await Promise.all([
                apiFetch("/appointments/doctor/me"),
                apiFetch("/prescriptions/doctor/me"),
            ]);
            setAppointments(getArrayFromResponse(appointmentsRes));
            setPrescriptions(getArrayFromResponse(prescriptionsRes));
        }
        catch (err) {
            toast.error(err.message || "Failed to load patients");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadData();
    }, []);
    const prescriptionAppointmentIds = useMemo(() => {
        return new Set(prescriptions
            .map((item) => getPrescriptionAppointmentId(item))
            .filter(Boolean));
    }, [prescriptions]);
    const patients = useMemo(() => {
        const map = new Map();
        for (const appt of appointments) {
            const patientId = appt.userId?._id;
            if (!patientId)
                continue;
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
            }
            else {
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
        if (!q)
            return patients;
        return patients.filter((patient) => patient.fullName.toLowerCase().includes(q) ||
            patient.email.toLowerCase().includes(q));
    }, [patients, search]);
    const totalPatients = patients.length;
    const totalWithPrescription = patients.filter((p) => p.hasPrescription).length;
    const pendingAction = patients.filter((p) => canCreatePrescription(p) || canMarkAttendance(p)).length;
    const openPrescriptionModal = (patient) => {
        if (!canCreatePrescription(patient))
            return;
        setSelectedPatient(patient);
        setDiagnosis("");
        setMedicineNames([""]);
    };
    const closePrescriptionModal = () => {
        if (submitting)
            return;
        setSelectedPatient(null);
        setDiagnosis("");
        setMedicineNames([""]);
    };
    const handleMedicineChange = (index, value) => {
        setMedicineNames((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };
    const addMedicineField = () => {
        setMedicineNames((prev) => [...prev, ""]);
    };
    const removeMedicineField = (index) => {
        setMedicineNames((prev) => {
            if (prev.length === 1)
                return prev;
            return prev.filter((_, i) => i !== index);
        });
    };
    const handleUpdateAppointmentStatus = async (appointmentId, status) => {
        try {
            setStatusUpdatingId(appointmentId);
            await apiFetch(`/appointments/${appointmentId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
            });
            toast.success(status === "no_show"
                ? "Appointment marked as no show"
                : "Appointment marked as completed");
            await loadData();
        }
        catch (err) {
            toast.error(err.message || "Failed to update appointment status");
        }
        finally {
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
        }
        catch (err) {
            toast.error(err.message || "Failed to create prescription");
        }
        finally {
            setSubmitting(false);
        }
    };
    if (loading) {
        return (<div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
        Loading patients...
      </div>);
    }
    return (<div className="space-y-8 p-1 md:p-2">
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5"/>
              Patient Management
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                View patients from your booked appointments, update attendance,
                and create prescriptions from a cleaner professional interface.
              </p>
            </div>
          </div>

          <div className="relative w-full xl:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <Input placeholder="Search by patient name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 rounded-xl pl-10"/>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Patients</p>
              <p className="mt-2 text-2xl font-bold">{totalPatients}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">With Prescription</p>
              <p className="mt-2 text-2xl font-bold">{totalWithPrescription}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Pending Action</p>
              <p className="mt-2 text-2xl font-bold">{pendingAction}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-3xl border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Patient List</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review recent patient activity and perform appointment-related actions.
          </p>
        </CardHeader>

        <CardContent className="pt-3">
          {filteredPatients.length === 0 ? (<div className="rounded-2xl border border-dashed p-10 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/>
              <p className="text-sm font-medium">No patients found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try changing the search term or wait for new booked appointments.
              </p>
            </div>) : (<div className="space-y-4">
              {filteredPatients.map((patient) => {
                const createAllowed = canCreatePrescription(patient);
                const attendanceAllowed = canMarkAttendance(patient);
                const isStatusUpdating = statusUpdatingId === patient.lastAppointmentId;
                return (<Card key={patient.id} className="rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                            <UserRound className="h-5 w-5 text-primary"/>
                          </div>

                          <div className="min-w-0 flex-1 space-y-3">
                            <div>
                              <h3 className="text-base font-semibold">{patient.fullName}</h3>
                              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4 shrink-0"/>
                                <span className="truncate">{patient.email}</span>
                              </div>
                            </div>

                            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 shrink-0"/>
                                <span>
                                  {patient.lastDate} {patient.lastTime !== "-" ? `at ${patient.lastTime}` : ""}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 shrink-0"/>
                                <span>
                                  {patient.appointmentCount} Appointment
                                  {patient.appointmentCount > 1 ? "s" : ""}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Pill className="h-4 w-4 shrink-0"/>
                                <span>
                                  {patient.hasPrescription ? "Prescription Created" : "No Prescription Yet"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                          <Badge variant="outline" className={`text-xs rounded-full ${getStatusClass(patient.status)}`}>
                            {patient.status}
                          </Badge>

                          {patient.hasPrescription ? (<Badge variant="outline" className="text-xs rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              Prescription Created
                            </Badge>) : null}

                          {attendanceAllowed ? (<>
                              <Button size="sm" variant="outline" className="h-9 rounded-xl px-3 text-xs" onClick={() => patient.lastAppointmentId &&
                            handleUpdateAppointmentStatus(patient.lastAppointmentId, "no_show")} disabled={isStatusUpdating}>
                                {isStatusUpdating ? (<>
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin"/>
                                    Updating...
                                  </>) : (<>
                                    <CircleOff className="mr-1.5 h-3.5 w-3.5"/>
                                    No Show
                                  </>)}
                              </Button>

                              <Button size="sm" variant="outline" className="h-9 rounded-xl px-3 text-xs" onClick={() => patient.lastAppointmentId &&
                            handleUpdateAppointmentStatus(patient.lastAppointmentId, "completed")} disabled={isStatusUpdating}>
                                {isStatusUpdating ? (<>
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin"/>
                                    Updating...
                                  </>) : (<>
                                    <ClipboardCheck className="mr-1.5 h-3.5 w-3.5"/>
                                    Complete
                                  </>)}
                              </Button>
                            </>) : null}

                          {createAllowed ? (<Button size="sm" className="h-9 rounded-xl px-3 text-xs" onClick={() => openPrescriptionModal(patient)}>
                              Create Prescription
                            </Button>) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>);
            })}
            </div>)}
        </CardContent>
      </Card>

      {selectedPatient && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-background shadow-lg">
            <div className="border-b bg-background px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Create Prescription</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Patient: {selectedPatient.fullName}
                  </p>
                </div>

                <Button variant="ghost" size="icon" className="rounded-xl" onClick={closePrescriptionModal}>
                  <X className="h-4 w-4"/>
                </Button>
              </div>
            </div>

            <div className="max-h-[80vh] overflow-y-auto px-6 pb-6">
              <div className="space-y-6 py-6">
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Selected Patient</p>
                  <p className="mt-1 text-sm font-semibold">{selectedPatient.fullName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedPatient.email}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Diagnosis</label>
                  <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Enter diagnosis" className="min-h-[120px] w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none"/>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium">Medicines</label>
                    <Button type="button" variant="outline" size="sm" onClick={addMedicineField} className="h-9 rounded-xl">
                      <Plus className="mr-1.5 h-4 w-4"/>
                      Add Medicine
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {medicineNames.map((medicine, index) => (<div key={index} className="flex items-center gap-2 rounded-2xl border bg-muted/20 p-3">
                        <Input value={medicine} onChange={(e) => handleMedicineChange(index, e.target.value)} placeholder={`Medicine ${index + 1}`} className="h-11 rounded-xl"/>
                        <Button type="button" variant="outline" size="icon" className="h-11 w-11 rounded-xl" onClick={() => removeMedicineField(index)} disabled={medicineNames.length === 1}>
                          <X className="h-4 w-4"/>
                        </Button>
                      </div>))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <Button variant="outline" className="h-11 rounded-xl" onClick={closePrescriptionModal} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleCreatePrescription} disabled={submitting} className="h-11 rounded-xl">
                {submitting ? (<>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Saving...
                  </>) : ("Save Prescription")}
              </Button>
            </div>
          </div>
        </div>)}
    </div>);
}
