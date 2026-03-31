import { useEffect, useMemo, useState } from "react";
import { useCenterAdmin } from "@/contexts/CenterAdminContext";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  Stethoscope,
  Phone,
  Clock,
  DollarSign,
  Loader2,
  UserRound,
} from "lucide-react";

type Doctor = {
  id: string;
  name: string;
  specialization: string;
  clinic: string;
  fee: number;
  phone: string;
  centerId: string;
  startTime: string;
  endTime: string;
  sessionTime: number;
  isActive: boolean;
};

function mapDoctor(item: any): Doctor {
  const centerObj = item.centerId && typeof item.centerId === "object" ? item.centerId : null;
  return {
    id: String(item._id || item.id || ""),
    name: item.name || "",
    specialization: item.specialization || "",
    clinic: item.clinic || "",
    fee: Number(item.fee || 0),
    phone: item.phone || "",
    centerId: typeof item.centerId === "string" ? item.centerId : String(centerObj?._id || ""),
    startTime: item.startTime || "09:00",
    endTime: item.endTime || "17:00",
    sessionTime: Number(item.sessionTime || 30),
    isActive: Boolean(item.isActive),
  };
}

export default function CenterDoctorsPage() {
  const { centerId } = useCenterAdmin();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [specFilter, setSpecFilter] = useState("all");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Doctor | null>(null);

  async function fetchDoctors() {
    try {
      setLoading(true);
      setError("");
      const data = await apiFetch("/admin/doctors");
      const all: Doctor[] = Array.isArray(data?.items) ? data.items.map(mapDoctor) : [];
      const filtered = centerId ? all.filter((d) => d.centerId === centerId) : all;
      setDoctors(filtered);
    } catch (err: any) {
      setError(err.message || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDoctors(); }, [centerId]);

  async function handleToggle(doc: Doctor) {
    try {
      setTogglingId(doc.id);
      await apiFetch(`/admin/doctors/${doc.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !doc.isActive }),
      });
      await fetchDoctors();
    } catch (err: any) {
      setError(err.message || "Failed to update doctor");
    } finally {
      setTogglingId(null);
    }
  }

  const specializations = useMemo(
    () => [...new Set(doctors.map((d) => d.specialization).filter(Boolean))],
    [doctors]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return doctors.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q);
      const matchSpec = specFilter === "all" || d.specialization === specFilter;
      return matchSearch && matchSpec;
    });
  }, [doctors, search, specFilter]);

  const activeCount = doctors.filter((d) => d.isActive).length;

  return (
    <div className="space-y-8 p-1 md:p-2">
      {/* Header */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            <Stethoscope className="h-3.5 w-3.5" />
            Doctor Management
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Manage doctors assigned to this center.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Doctors</p>
              <p className="mt-2 text-2xl font-bold">{loading ? "--" : doctors.length}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="mt-2 text-2xl font-bold">{loading ? "--" : activeCount}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Specializations</p>
              <p className="mt-2 text-2xl font-bold">{loading ? "--" : specializations.length}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* List */}
      <Card className="rounded-3xl border shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">Doctor Directory</h2>
              <p className="text-sm text-muted-foreground">
                {filtered.length} of {doctors.length} doctors
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
              <div className="relative w-full xl:min-w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, specialization..."
                  className="h-11 rounded-xl pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["all", ...specializations].map((s) => (
                  <Button
                    key={s}
                    variant={specFilter === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSpecFilter(s)}
                    className="rounded-xl capitalize shrink-0"
                  >
                    {s === "all" ? "All" : s}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading doctors...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <Stethoscope className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No doctors found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((doc) => (
                <Card
                  key={doc.id}
                  className="cursor-pointer rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  onClick={() => setSelected(doc)}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                          <UserRound className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold">{doc.name}</h3>
                            <Badge
                              variant="secondary"
                              className={`rounded-full border px-3 py-1 text-[11px] ${
                                doc.isActive
                                  ? "bg-success/10 text-success border-success/20"
                                  : "bg-muted text-muted-foreground border-transparent"
                              }`}
                            >
                              {doc.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="h-4 w-4 shrink-0" />
                              <span className="truncate">{doc.specialization || "—"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 shrink-0" />
                              <span className="truncate">{doc.phone || "—"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 shrink-0" />
                              <span className="truncate">{doc.startTime} — {doc.endTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 shrink-0" />
                              <span className="truncate">Rs. {doc.fee.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {togglingId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Switch
                            checked={doc.isActive}
                            onCheckedChange={() => handleToggle(doc)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={(e) => { e.stopPropagation(); setSelected(doc); }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="border-b bg-background px-6 py-4">
            <DialogTitle className="text-xl">{selected?.name}</DialogTitle>
            <DialogDescription>{selected?.specialization}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="grid gap-4 p-6 md:grid-cols-2">
              {[
                { label: "Phone", value: selected.phone },
                { label: "Fee", value: `Rs. ${selected.fee.toLocaleString()}` },
                { label: "Clinic", value: selected.clinic },
                { label: "Session Time", value: `${selected.sessionTime} min` },
                { label: "Working Hours", value: `${selected.startTime} — ${selected.endTime}` },
                { label: "Status", value: selected.isActive ? "Active" : "Inactive" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-sm font-semibold break-words">{value || "—"}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
