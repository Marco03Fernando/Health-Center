import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  ClipboardList,
  Download,
  Eye,
  Loader2,
  FileText,
  Pill,
  UserRound,
  Mail,
  CalendarDays,
  Stethoscope,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

type PrescriptionItem = {
  _id: string;
  prescriptionNo?: string;
  diagnosis?: string;
  status?: string;
  notes?: string;
  items?: {
    medicineName?: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
    quantity?: number;
  }[];
  userId?: {
    _id?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  doctorId?: {
    _id?: string;
    name?: string;
    specialization?: string;
    clinic?: string;
    fee?: number;
    phone?: string;
  };
  centerId?: {
    _id?: string;
    name?: string;
    district?: string;
  };
  appointmentId?: {
    _id?: string;
    status?: string;
    createdAt?: string;
    slotId?: {
      _id?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
    };
  };
  createdAt?: string;
};

function getArrayFromResponse(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.prescriptions)) return data.prescriptions;
  return [];
}

function getApiBaseUrl() {
  const viteUrl =
    typeof import.meta !== "undefined" &&
    (import.meta as any)?.env?.VITE_API_URL
      ? String((import.meta as any).env.VITE_API_URL)
      : "";

  const nextUrl =
    typeof process !== "undefined" &&
    (process as any)?.env?.NEXT_PUBLIC_API_URL
      ? String((process as any).env.NEXT_PUBLIC_API_URL)
      : "";

  return viteUrl || nextUrl || "";
}

function joinUrl(base: string, path: string) {
  if (!base) return path;
  return `${base.replace(/\/+$/, "")}${path}`;
}

function getStoredToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function getStatusClass(status?: string) {
  if (status === "dispensed") {
    return "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400";
  }
  if (status === "cancelled") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }
  return "border-primary/30 bg-primary/10 text-primary";
}

export default function Prescriptions() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [selectedPrescription, setSelectedPrescription] =
    useState<PrescriptionItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/prescriptions/doctor/me");
      setPrescriptions(getArrayFromResponse(res));
    } catch (err: any) {
      toast.error(err.message || "Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const filteredPrescriptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return prescriptions;

    return prescriptions.filter((item) => {
      const prescriptionNo = item.prescriptionNo?.toLowerCase() || "";
      const diagnosis = item.diagnosis?.toLowerCase() || "";
      const patientName = item.userId?.fullName?.toLowerCase() || "";
      const patientEmail = item.userId?.email?.toLowerCase() || "";

      return (
        prescriptionNo.includes(q) ||
        diagnosis.includes(q) ||
        patientName.includes(q) ||
        patientEmail.includes(q)
      );
    });
  }, [prescriptions, search]);

  const issuedCount = prescriptions.filter(
    (item) => (item.status || "issued") === "issued"
  ).length;
  const dispensedCount = prescriptions.filter(
    (item) => item.status === "dispensed"
  ).length;
  const totalMedicines = prescriptions.reduce(
    (sum, item) => sum + (item.items?.length || 0),
    0
  );

  const handleViewDetails = async (id: string) => {
    try {
      setDetailsLoading(true);
      const res = await apiFetch(`/prescriptions/${id}`);
      const data = res?.data || res;
      setSelectedPrescription(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load prescription details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDownloadPdf = async (item: PrescriptionItem) => {
    try {
      setDownloadingId(item._id);

      const token = getStoredToken();
      const baseUrl = getApiBaseUrl();
      const url = joinUrl(baseUrl, `/prescriptions/${item._id}/pdf`);

      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        let message = "Failed to download PDF";
        try {
          const text = await res.text();
          if (text) message = text;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${item.prescriptionNo || "prescription"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
      toast.success("Prescription PDF downloaded");
    } catch (err: any) {
      toast.error(err.message || "Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-8 p-1 md:p-2">
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <ClipboardList className="h-3.5 w-3.5" />
              Prescription Records
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Review prescriptions issued for your patients, open full details,
                and download PDF copies from a cleaner professional interface.
              </p>
            </div>
          </div>

          <div className="relative w-full xl:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by prescription no, patient, diagnosis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-xl pl-10"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Prescriptions</p>
              <p className="mt-2 text-2xl font-bold">{loading ? "--" : prescriptions.length}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Issued</p>
              <p className="mt-2 text-2xl font-bold">{loading ? "--" : issuedCount}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Medicines Listed</p>
              <p className="mt-2 text-2xl font-bold">{loading ? "--" : totalMedicines}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-3xl border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Prescription List</CardTitle>
          <p className="text-sm text-muted-foreground">
            Browse recent prescriptions and open detailed information for each patient.
          </p>
        </CardHeader>

        <CardContent className="pt-3">
          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading prescriptions...
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No prescriptions found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try changing the search term or wait for new issued prescriptions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrescriptions.map((item) => (
                <Card
                  key={item._id}
                  className="rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                          <Pill className="h-5 w-5 text-primary" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold">
                              {item.prescriptionNo || "No Prescription No"}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`rounded-full text-xs ${getStatusClass(item.status || "issued")}`}
                            >
                              {item.status || "issued"}
                            </Badge>
                          </div>

                          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <UserRound className="h-4 w-4 shrink-0" />
                              <span className="truncate">
                                {item.userId?.fullName || "Unknown Patient"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 min-w-0">
                              <Mail className="h-4 w-4 shrink-0" />
                              <span className="truncate">{item.userId?.email || "-"}</span>
                            </div>

                            <div className="flex items-center gap-2 min-w-0">
                              <CalendarDays className="h-4 w-4 shrink-0" />
                              <span className="truncate">
                                {item.appointmentId?.slotId?.date || "-"}
                                {item.appointmentId?.slotId?.startTime
                                  ? ` at ${item.appointmentId.slotId.startTime}`
                                  : ""}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 min-w-0">
                              <Pill className="h-4 w-4 shrink-0" />
                              <span>{item.items?.length || 0} medicine(s)</span>
                            </div>
                          </div>

                          <div className="rounded-xl bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Diagnosis:</span>{" "}
                            {item.diagnosis || "-"}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 xl:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(item._id)}
                          disabled={detailsLoading}
                          className="h-10 rounded-xl px-4"
                        >
                          {detailsLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="mr-2 h-4 w-4" />
                          )}
                          View
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleDownloadPdf(item)}
                          disabled={downloadingId === item._id}
                          className="h-10 rounded-xl px-4"
                        >
                          {downloadingId === item._id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          {downloadingId === item._id ? "Downloading..." : "Download PDF"}
                        </Button>
                      </div>
                    </div>

                    {item.notes ? (
                      <div className="mt-4 rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Notes:</span> {item.notes}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedPrescription}
        onOpenChange={(open) => {
          if (!open) setSelectedPrescription(null);
        }}
      >
        <DialogContent className="max-w-4xl rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-5">
            <DialogTitle className="text-xl">
              {selectedPrescription?.prescriptionNo || "Prescription Details"}
            </DialogTitle>
            <DialogDescription>
              Review prescription information, patient details, and prescribed medicines.
            </DialogDescription>
          </DialogHeader>

          {selectedPrescription && (
            <div className="max-h-[80vh] overflow-y-auto px-6 pb-6">
              <div className="space-y-6 py-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Prescription No</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {selectedPrescription.prescriptionNo || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-2">
                      <Badge
                        variant="outline"
                        className={`rounded-full text-xs ${getStatusClass(selectedPrescription.status || "issued")}`}
                      >
                        {selectedPrescription.status || "issued"}
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Created At</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {selectedPrescription.createdAt
                        ? new Date(selectedPrescription.createdAt).toLocaleString()
                        : "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Patient</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {selectedPrescription.userId?.fullName || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {selectedPrescription.userId?.email || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {selectedPrescription.userId?.phone || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Doctor</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {selectedPrescription.doctorId?.name || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Specialization</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {selectedPrescription.doctorId?.specialization || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Center</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {selectedPrescription.centerId?.name || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Appointment Date</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {selectedPrescription.appointmentId?.slotId?.date || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Appointment Time</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {selectedPrescription.appointmentId?.slotId?.startTime || "-"}
                      {selectedPrescription.appointmentId?.slotId?.endTime
                        ? ` - ${selectedPrescription.appointmentId?.slotId?.endTime}`
                        : ""}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Medicines</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {selectedPrescription.items?.length || 0}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border p-4">
                  <p className="mb-2 text-sm font-semibold">Diagnosis</p>
                  <p className="break-words text-sm text-muted-foreground">
                    {selectedPrescription.diagnosis || "-"}
                  </p>
                </div>

                {selectedPrescription.notes ? (
                  <div className="rounded-2xl border p-4">
                    <p className="mb-2 text-sm font-semibold">Notes</p>
                    <p className="break-words text-sm text-muted-foreground">
                      {selectedPrescription.notes}
                    </p>
                  </div>
                ) : null}

                <div className="rounded-2xl border p-4">
                  <p className="mb-3 text-sm font-semibold">Medicines</p>

                  {!selectedPrescription.items || selectedPrescription.items.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                      No medicines added.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedPrescription.items.map((medicine, index) => (
                        <div
                          key={`${medicine.medicineName || "medicine"}-${index}`}
                          className="rounded-xl border bg-muted/20 p-4"
                        >
                          <p className="text-sm font-semibold">
                            {index + 1}. {medicine.medicineName || "-"}
                          </p>

                          {(medicine.dosage ||
                            medicine.frequency ||
                            medicine.duration ||
                            medicine.quantity ||
                            medicine.instructions) && (
                            <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                              {medicine.dosage ? (
                                <div>
                                  <span className="font-medium text-foreground">Dosage:</span>{" "}
                                  {medicine.dosage}
                                </div>
                              ) : null}

                              {medicine.frequency ? (
                                <div>
                                  <span className="font-medium text-foreground">Frequency:</span>{" "}
                                  {medicine.frequency}
                                </div>
                              ) : null}

                              {medicine.duration ? (
                                <div>
                                  <span className="font-medium text-foreground">Duration:</span>{" "}
                                  {medicine.duration}
                                </div>
                              ) : null}

                              {medicine.quantity ? (
                                <div>
                                  <span className="font-medium text-foreground">Quantity:</span>{" "}
                                  {medicine.quantity}
                                </div>
                              ) : null}

                              {medicine.instructions ? (
                                <div className="md:col-span-2">
                                  <span className="font-medium text-foreground">Instructions:</span>{" "}
                                  {medicine.instructions}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => handleDownloadPdf(selectedPrescription)}
                    disabled={downloadingId === selectedPrescription._id}
                    className="h-11 rounded-xl px-5"
                  >
                    {downloadingId === selectedPrescription._id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {downloadingId === selectedPrescription._id
                      ? "Downloading..."
                      : "Download PDF"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}