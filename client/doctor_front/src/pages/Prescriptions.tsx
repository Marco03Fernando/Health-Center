import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ClipboardList, Download, Eye, X } from "lucide-react";
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

  if (loading) {
    return <div className="p-6">Loading prescriptions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ClipboardList className="h-6 w-6 text-primary" />
            Prescriptions
          </h1>
          <p className="text-muted-foreground">
            View prescriptions issued for your patients
          </p>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by prescription no, patient, diagnosis"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prescription List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPrescriptions.length === 0 ? (
            <div className="rounded-lg border bg-muted p-6 text-center text-sm text-muted-foreground">
              No prescriptions found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPrescriptions.map((item) => (
                <div
                  key={item._id}
                  className="rounded-xl border p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="font-semibold">
                        {item.prescriptionNo || "No Prescription No"}
                      </h3>

                      <p className="text-sm text-muted-foreground break-words">
                        Patient: {item.userId?.fullName || "Unknown Patient"}
                      </p>

                      <p className="text-sm text-muted-foreground break-words">
                        Email: {item.userId?.email || "-"}
                      </p>

                      <p className="text-sm text-muted-foreground break-words">
                        Diagnosis: {item.diagnosis || "-"}
                      </p>

                      <p className="text-sm text-muted-foreground break-words">
                        Appointment: {item.appointmentId?.slotId?.date || "-"}{" "}
                        {item.appointmentId?.slotId?.startTime
                          ? `at ${item.appointmentId.slotId.startTime}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 lg:items-end">
                      <Badge
                        variant="outline"
                        className={
                          item.status === "dispensed"
                            ? "w-fit border-success/30 bg-success/10 text-success"
                            : "w-fit border-primary/30 bg-primary/10 text-primary"
                        }
                      >
                        {item.status || "issued"}
                      </Badge>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(item._id)}
                          disabled={detailsLoading}
                          className="min-w-[110px]"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleDownloadPdf(item)}
                          disabled={downloadingId === item._id}
                          className="min-w-[150px]"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {downloadingId === item._id
                            ? "Downloading..."
                            : "Download PDF"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {item.notes ? (
                    <div className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                      Notes: {item.notes}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPrescription ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-background shadow-lg">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {selectedPrescription.prescriptionNo || "Prescription Details"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Patient: {selectedPrescription.userId?.fullName || "Unknown Patient"}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedPrescription(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 font-medium">Basic Info</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Prescription No: </span>
                      <span>{selectedPrescription.prescriptionNo || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status: </span>
                      <span>{selectedPrescription.status || "issued"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created At: </span>
                      <span>
                        {selectedPrescription.createdAt
                          ? new Date(selectedPrescription.createdAt).toLocaleString()
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Diagnosis: </span>
                      <span>{selectedPrescription.diagnosis || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Notes: </span>
                      <span>{selectedPrescription.notes || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 font-medium">Patient / Appointment</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Patient: </span>
                      <span>{selectedPrescription.userId?.fullName || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email: </span>
                      <span>{selectedPrescription.userId?.email || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone: </span>
                      <span>{selectedPrescription.userId?.phone || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Appointment Date: </span>
                      <span>{selectedPrescription.appointmentId?.slotId?.date || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Appointment Time: </span>
                      <span>
                        {selectedPrescription.appointmentId?.slotId?.startTime || "-"}
                        {selectedPrescription.appointmentId?.slotId?.endTime
                          ? ` - ${selectedPrescription.appointmentId?.slotId?.endTime}`
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-3 font-medium">Medicines</h3>

                {!selectedPrescription.items || selectedPrescription.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No medicines added.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPrescription.items.map((medicine, index) => (
                      <div
                        key={`${medicine.medicineName || "medicine"}-${index}`}
                        className="rounded-lg bg-muted p-3 text-sm"
                      >
                        <div className="font-medium">
                          {index + 1}. {medicine.medicineName || "-"}
                        </div>

                        {medicine.dosage ||
                        medicine.frequency ||
                        medicine.duration ||
                        medicine.quantity ||
                        medicine.instructions ? (
                          <div className="mt-2 space-y-1 text-muted-foreground">
                            {medicine.dosage ? <div>Dosage: {medicine.dosage}</div> : null}
                            {medicine.frequency ? (
                              <div>Frequency: {medicine.frequency}</div>
                            ) : null}
                            {medicine.duration ? (
                              <div>Duration: {medicine.duration}</div>
                            ) : null}
                            {medicine.quantity ? (
                              <div>Quantity: {medicine.quantity}</div>
                            ) : null}
                            {medicine.instructions ? (
                              <div>Instructions: {medicine.instructions}</div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t p-4">
              <Button
                variant="outline"
                onClick={() => setSelectedPrescription(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => handleDownloadPdf(selectedPrescription)}
                disabled={downloadingId === selectedPrescription._id}
              >
                <Download className="mr-2 h-4 w-4" />
                {downloadingId === selectedPrescription._id
                  ? "Downloading..."
                  : "Download PDF"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}