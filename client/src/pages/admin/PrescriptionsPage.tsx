import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  Pill,
  Download,
  Loader2,
  FileText,
  Building2,
  User,
  Stethoscope,
  CalendarDays,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { API_BASE_URL } from "@/config/api";type PrescriptionItem = {
  medicineName?: string;
  quantity?: number;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
};

type PrescriptionRecord = {
  _id: string;
  prescriptionNo: string;
  diagnosis?: string;
  notes?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  items?: PrescriptionItem[];
  userId?: {
    _id?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  doctorId?: {
    _id?: string;
    name?: string;
    specialization?: string;
    clinic?: string;
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
};

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-transparent",
  issued: "bg-primary/10 text-primary border-primary/20",
  dispensed:
    "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function getToken() {
  return localStorage.getItem("admin_token") || localStorage.getItem("token") || "";
}

function getStatusLabel(status?: string) {
  if (!status) return "-";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function PrescriptionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<PrescriptionRecord | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  async function fetchPrescriptions() {
    try {
      setLoading(true);
      setError("");
      const data = await apiFetch("/prescriptions?limit=100");
      setPrescriptions(Array.isArray(data?.data) ? data.data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load prescriptions");
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPdf(id: string, prescriptionNo: string) {
    try {
      setDownloading(true);

      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/prescriptions/${id}/pdf`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${prescriptionNo || "prescription"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.message || "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  }

  const filtered = useMemo(() => {
    return prescriptions.filter((p) => {
      const keyword = search.trim().toLowerCase();

      const matchesSearch =
        !keyword ||
        (p.prescriptionNo || "").toLowerCase().includes(keyword) ||
        (p.userId?.fullName || "").toLowerCase().includes(keyword) ||
        (p.doctorId?.name || "").toLowerCase().includes(keyword) ||
        (p.centerId?.name || "").toLowerCase().includes(keyword) ||
        (p.diagnosis || "").toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === "all" || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [prescriptions, search, statusFilter]);

  const issuedCount = prescriptions.filter((p) => p.status === "issued").length;
  const dispensedCount = prescriptions.filter((p) => p.status === "dispensed").length;
  const draftCount = prescriptions.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-8 p-1 md:p-2">
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Prescription Management
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                View, search, and manage all doctor-issued prescriptions with a
                cleaner and more professional admin layout.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Prescriptions</p>
              <p className="mt-2 text-2xl font-bold">
                {loading ? "--" : prescriptions.length}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Issued</p>
              <p className="mt-2 text-2xl font-bold">
                {loading ? "--" : issuedCount}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Dispensed / Draft</p>
              <p className="mt-2 text-2xl font-bold">
                {loading ? "--" : `${dispensedCount} / ${draftCount}`}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-3xl border shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Prescription Directory</h2>
              <p className="text-sm text-muted-foreground">
                Search prescriptions by patient, doctor, center, diagnosis, or prescription number.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
              <div className="relative w-full xl:min-w-[360px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by prescription no, doctor, patient, center, or diagnosis..."
                  className="h-11 rounded-xl pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 w-full rounded-xl xl:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="dispensed">Dispensed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading prescriptions...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center">
                <Pill className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No prescriptions found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try changing the search or filter settings.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((rx) => {
                  const displayDate =
                    rx.appointmentId?.slotId?.date || rx.createdAt || rx.updatedAt;

                  return (
                    <Card
                      key={rx._id}
                      className="cursor-pointer rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      onClick={() => setSelected(rx)}
                    >
                      <CardContent className="p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                              <Pill className="h-5 w-5 text-primary" />
                            </div>

                            <div className="min-w-0 flex-1 space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold tracking-tight">
                                  {rx.prescriptionNo}
                                </h3>
                                <Badge
                                  variant="secondary"
                                  className={`rounded-full border px-3 py-1 text-[11px] ${statusStyles[rx.status] || "bg-muted text-muted-foreground border-transparent"}`}
                                >
                                  {getStatusLabel(rx.status)}
                                </Badge>
                              </div>

                              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                                <div className="flex min-w-0 items-center gap-2">
                                  <User className="h-4 w-4 shrink-0" />
                                  <span className="truncate">
                                    {rx.userId?.fullName || "Unknown Patient"}
                                  </span>
                                </div>

                                <div className="flex min-w-0 items-center gap-2">
                                  <Stethoscope className="h-4 w-4 shrink-0" />
                                  <span className="truncate">
                                    {rx.doctorId?.name || "Unknown Doctor"}
                                  </span>
                                </div>

                                <div className="flex min-w-0 items-center gap-2">
                                  <Building2 className="h-4 w-4 shrink-0" />
                                  <span className="truncate">
                                    {rx.centerId?.name || "No Center"}
                                  </span>
                                </div>

                                <div className="flex min-w-0 items-center gap-2">
                                  <CalendarDays className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{formatDate(displayDate)}</span>
                                </div>
                              </div>

                              <div className="rounded-xl bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">Diagnosis:</span>{" "}
                                {rx.diagnosis?.trim() || "No diagnosis provided"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 rounded-xl"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelected(rx);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="sticky top-0 z-10 space-y-2 border-b bg-background px-6 py-4">
            <DialogTitle className="text-xl">
              Prescription {selected?.prescriptionNo || ""}
            </DialogTitle>
            <DialogDescription>
              Review prescription details and download the PDF copy.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="max-h-[80vh] overflow-y-auto px-6 pb-6">
              <div className="space-y-6 py-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Patient</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {selected.userId?.fullName || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Doctor</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {selected.doctorId?.name || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Center</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {selected.centerId?.name || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {formatDate(
                        selected.appointmentId?.slotId?.date ||
                          selected.createdAt ||
                          selected.updatedAt
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {selected.appointmentId?.slotId?.startTime
                        ? `${selected.appointmentId.slotId.startTime}${
                            selected.appointmentId?.slotId?.endTime
                              ? ` - ${selected.appointmentId.slotId.endTime}`
                              : ""
                          }`
                        : "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-2">
                      <Badge
                        variant="secondary"
                        className={`rounded-full border px-3 py-1 text-[11px] ${statusStyles[selected.status] || "bg-muted text-muted-foreground border-transparent"}`}
                      >
                        {getStatusLabel(selected.status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border p-4">
                  <p className="mb-2 text-sm font-semibold">Diagnosis</p>
                  <p className="break-words text-sm text-muted-foreground">
                    {selected.diagnosis || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border p-4">
                  <p className="mb-3 text-sm font-semibold">Medicines</p>

                  {(selected.items || []).length > 0 ? (
                    <div className="space-y-3">
                      {selected.items!.map((item, i) => (
                        <div
                          key={i}
                          className="flex flex-col gap-3 rounded-xl border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="break-words text-sm font-medium">
                              {item.medicineName || "-"}
                            </p>
                          </div>

                          <Badge variant="outline" className="w-fit rounded-full">
                            Qty: {item.quantity ?? 0}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                      No medicines added.
                    </div>
                  )}
                </div>

                {selected.notes ? (
                  <div className="rounded-2xl border p-4">
                    <p className="mb-2 text-sm font-semibold">Additional Notes</p>
                    <p className="break-words text-sm text-muted-foreground">
                      {selected.notes}
                    </p>
                  </div>
                ) : null}

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() =>
                      handleDownloadPdf(selected._id, selected.prescriptionNo)
                    }
                    disabled={downloading}
                    className="h-11 shrink-0 rounded-xl px-5"
                  >
                    {downloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download PDF
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