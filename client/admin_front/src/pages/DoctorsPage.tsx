import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Clock,
  Phone,
  DollarSign,
  Edit,
  Building2,
  MapPin,
  Stethoscope,
  CalendarDays,
  UserRound,
  Loader2,
} from "lucide-react";

type Doctor = {
  id: string;
  _id?: string;
  userId?: string;
  name: string;
  specialization: string;
  clinic: string;
  fee: number;
  phone: string;
  centerId: string;
  centerName?: string;
  startTime: string;
  endTime: string;
  sessionTime: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type DoctorApiResponse = {
  _id?: string;
  id?: string;
  userId?: string;
  name?: string;
  specialization?: string;
  clinic?: string;
  fee?: number;
  phone?: string;
  centerId?:
    | string
    | {
        _id?: string;
        name?: string;
        location?: string;
      };
  startTime?: string;
  endTime?: string;
  sessionTime?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Center = {
  _id: string;
  name: string;
  address?: string;
  district?: string;
  phone?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081/api";
const TOKEN_KEYS = ["adminToken", "token", "accessToken"];

function getStoredToken() {
  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return null;
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
}

function mapDoctor(item: DoctorApiResponse): Doctor {
  const centerObject = item.centerId && typeof item.centerId === "object" ? item.centerId : null;

  return {
    id: String(item._id || item.id || ""),
    _id: item._id,
    userId: item.userId,
    name: item.name || "",
    specialization: item.specialization || "",
    clinic: item.clinic || "",
    fee: Number(item.fee || 0),
    phone: item.phone || "",
    centerId:
      typeof item.centerId === "string" ? item.centerId : String(centerObject?._id || ""),
    centerName: centerObject?.location || centerObject?.name || "",
    startTime: item.startTime || "09:00",
    endTime: item.endTime || "17:00",
    sessionTime: Number(item.sessionTime || 30),
    isActive: Boolean(item.isActive),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

type CreateDoctorForm = {
  fullName: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  centerId: string;
  specialization: string;
  clinic: string;
  fee: string;
  startTime: string;
  endTime: string;
  sessionTime: string;
  date: string;
};

type EditDoctorForm = {
  name: string;
  centerId: string;
  specialization: string;
  clinic: string;
  fee: string;
  phone: string;
  startTime: string;
  endTime: string;
  sessionTime: string;
};

const today = new Date().toISOString().split("T")[0];

const initialCreateForm: CreateDoctorForm = {
  fullName: "",
  name: "",
  email: "",
  password: "",
  phone: "",
  centerId: "",
  specialization: "",
  clinic: "",
  fee: "",
  startTime: "09:00",
  endTime: "17:00",
  sessionTime: "30",
  date: today,
};

const initialEditForm: EditDoctorForm = {
  name: "",
  centerId: "",
  specialization: "",
  clinic: "",
  fee: "",
  phone: "",
  startTime: "09:00",
  endTime: "17:00",
  sessionTime: "30",
};

export default function DoctorsPage() {
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [centerSearch, setCenterSearch] = useState("");
  const [doctorCenterFilter, setDoctorCenterFilter] = useState("");
  const [loadingCenters, setLoadingCenters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [specFilter, setSpecFilter] = useState("all");
  const [error, setError] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSlotsDialog, setShowSlotsDialog] = useState<Doctor | null>(null);

  const [newDoctor, setNewDoctor] = useState<CreateDoctorForm>(initialCreateForm);
  const [editDoctor, setEditDoctor] = useState<EditDoctorForm>(initialEditForm);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiFetch("/admin/doctors");
      const items = Array.isArray(data?.items) ? data.items.map(mapDoctor) : [];
      setDoctorsList(items);
    } catch (err: any) {
      setError(err.message || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    try {
      setLoadingCenters(true);
      const data = await apiFetch("/centers");
      const items = Array.isArray(data?.data) ? data.data : [];
      setCenters(items);
    } catch {
      setCenters([]);
    } finally {
      setLoadingCenters(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchCenters();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      setEditDoctor({
        name: selectedDoctor.name || "",
        centerId: selectedDoctor.centerId || "",
        specialization: selectedDoctor.specialization || "",
        clinic: selectedDoctor.clinic || "",
        fee: String(selectedDoctor.fee ?? ""),
        phone: selectedDoctor.phone || "",
        startTime: selectedDoctor.startTime || "09:00",
        endTime: selectedDoctor.endTime || "17:00",
        sessionTime: String(selectedDoctor.sessionTime ?? 30),
      });
    } else {
      setEditDoctor(initialEditForm);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (!showAddDialog) {
      setCenterSearch("");
      return;
    }

    const selectedCenter = centers.find((c) => c._id === newDoctor.centerId);
    if (selectedCenter) {
      setCenterSearch(selectedCenter.name || "");
    }
  }, [showAddDialog, newDoctor.centerId, centers]);

  const specializations = useMemo(
    () => [...new Set(doctorsList.map((d) => d.specialization).filter(Boolean))],
    [doctorsList]
  );

  const filteredCenters = useMemo(() => {
    const q = centerSearch.trim().toLowerCase();
    if (!q) return centers;

    return centers.filter((center) => {
      const name = (center.name || "").toLowerCase();
      const district = (center.district || "").toLowerCase();
      const address = (center.address || "").toLowerCase();
      return name.includes(q) || district.includes(q) || address.includes(q);
    });
  }, [centers, centerSearch]);

  const doctorCenterSuggestions = useMemo(() => {
    const names = new Set<string>();

    centers.forEach((center) => {
      if (center.name?.trim()) names.add(center.name.trim());
    });

    doctorsList.forEach((doc) => {
      if (doc.centerName?.trim()) names.add(doc.centerName.trim());
    });

    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [centers, doctorsList]);

  const filteredDoctorCenterSuggestions = useMemo(() => {
    const q = doctorCenterFilter.trim().toLowerCase();
    if (!q) return doctorCenterSuggestions;

    return doctorCenterSuggestions.filter((name) => name.toLowerCase().includes(q));
  }, [doctorCenterSuggestions, doctorCenterFilter]);

  const getCenterDisplayName = (doc: Doctor) => {
    if (doc.centerName && doc.centerName.trim()) return doc.centerName;

    const matchedCenter = centers.find((c) => c._id === doc.centerId);
    if (!matchedCenter) return "Not available";

    return matchedCenter.name || matchedCenter.district || matchedCenter.address || "Not available";
  };

  const filtered = useMemo(() => {
    return doctorsList.filter((d) => {
      const displayCenter = getCenterDisplayName(d).toLowerCase();
      const keyword = search.toLowerCase();
      const centerKeyword = doctorCenterFilter.trim().toLowerCase();

      const matchesSearch =
        d.name.toLowerCase().includes(keyword) ||
        d.specialization.toLowerCase().includes(keyword) ||
        d.clinic.toLowerCase().includes(keyword) ||
        d.phone.toLowerCase().includes(keyword) ||
        displayCenter.includes(keyword);

      const matchesSpec = specFilter === "all" || d.specialization === specFilter;
      const matchesCenter = !centerKeyword || displayCenter.includes(centerKeyword);

      return matchesSearch && matchesSpec && matchesCenter;
    });
  }, [doctorsList, search, specFilter, centers, doctorCenterFilter]);

  const activeCount = doctorsList.filter((d) => d.isActive).length;

  const handleCenterInputChange = (value: string) => {
    setCenterSearch(value);

    const exactMatch = centers.find(
      (center) => center.name.trim().toLowerCase() === value.trim().toLowerCase()
    );

    setNewDoctor((prev) => ({
      ...prev,
      centerId: exactMatch?._id || "",
    }));
  };

  const handleAddDoctor = async () => {
    try {
      setSubmitting(true);
      setError("");

      if (!newDoctor.centerId.trim()) {
        throw new Error("Please select a valid center");
      }

      const payload = {
        fullName: newDoctor.fullName.trim(),
        name: newDoctor.name.trim() || newDoctor.fullName.trim(),
        email: newDoctor.email.trim(),
        password: newDoctor.password,
        phone: newDoctor.phone.trim(),
        centerId: newDoctor.centerId.trim(),
        specialization: newDoctor.specialization.trim(),
        clinic: newDoctor.clinic.trim(),
        fee: Number(newDoctor.fee),
        startTime: newDoctor.startTime,
        endTime: newDoctor.endTime,
        sessionTime: Number(newDoctor.sessionTime),
        date: newDoctor.date,
        generateSlots: true,
      };

      await apiFetch("/admin/doctors", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setShowAddDialog(false);
      setCenterSearch("");
      setNewDoctor(initialCreateForm);
      await fetchDoctors();
    } catch (err: any) {
      setError(err.message || "Failed to create doctor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDoctor = async () => {
    if (!selectedDoctor) return;

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        name: editDoctor.name.trim(),
        centerId: editDoctor.centerId.trim(),
        specialization: editDoctor.specialization.trim(),
        clinic: editDoctor.clinic.trim(),
        fee: Number(editDoctor.fee),
        phone: editDoctor.phone.trim(),
        startTime: editDoctor.startTime,
        endTime: editDoctor.endTime,
        sessionTime: Number(editDoctor.sessionTime),
      };

      await apiFetch(`/admin/doctors/${selectedDoctor.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setSelectedDoctor(null);
      await fetchDoctors();
    } catch (err: any) {
      setError(err.message || "Failed to update doctor");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (doctor: Doctor) => {
    try {
      setTogglingId(doctor.id);
      setError("");

      await apiFetch(`/admin/doctors/${doctor.id}/active`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !doctor.isActive }),
      });

      setDoctorsList((prev) =>
        prev.map((d) => (d.id === doctor.id ? { ...d, isActive: !d.isActive } : d))
      );
    } catch (err: any) {
      setError(err.message || "Failed to update active status");
    } finally {
      setTogglingId(null);
    }
  };

  const generateSlots = (doc: Doctor) => {
    const slots: string[] = [];
    const [sh, sm] = (doc.startTime || "09:00").split(":").map(Number);
    const [eh, em] = (doc.endTime || "17:00").split(":").map(Number);

    let current = sh * 60 + sm;
    const end = eh * 60 + em;
    const duration = Number(doc.sessionTime || 30);

    while (current + duration <= end) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      current += duration;
    }

    return slots;
  };

  return (
    <div className="space-y-8 p-1 md:p-2">
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Stethoscope className="h-3.5 w-3.5" />
              Doctor Management
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Manage doctor profiles, center assignments, consultation schedules,
                and availability in a cleaner professional layout.
              </p>
            </div>
          </div>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-11 rounded-xl px-5 shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Doctor
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden">
              <DialogHeader className="border-b bg-background px-6 py-5">
                <DialogTitle className="text-xl">Add New Doctor</DialogTitle>
                <DialogDescription>
                  Create a doctor profile, link the account, assign a center, and set schedule details.
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[80vh] overflow-y-auto px-6 pb-6">
                <div className="space-y-6 py-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full Name (User Account)</Label>
                      <Input
                        className="h-11 rounded-xl"
                        value={newDoctor.fullName}
                        onChange={(e) => setNewDoctor({ ...newDoctor, fullName: e.target.value })}
                        placeholder="Enter full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Doctor Display Name</Label>
                      <Input
                        className="h-11 rounded-xl"
                        value={newDoctor.name}
                        onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                        placeholder="Enter display name"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        className="h-11 rounded-xl"
                        value={newDoctor.email}
                        onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        className="h-11 rounded-xl"
                        value={newDoctor.password}
                        onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                        placeholder="Enter password"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        className="h-11 rounded-xl"
                        value={newDoctor.phone}
                        onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Center</Label>
                      <Input
                        list="center-options"
                        className="h-11 rounded-xl"
                        value={centerSearch}
                        onChange={(e) => handleCenterInputChange(e.target.value)}
                        placeholder={loadingCenters ? "Loading centers..." : "Type center name"}
                        autoComplete="off"
                      />
                      <datalist id="center-options">
                        {filteredCenters.map((center) => (
                          <option key={center._id} value={center.name} />
                        ))}
                      </datalist>
                      <p className="text-xs text-muted-foreground">
                        {newDoctor.centerId
                          ? `Selected center: ${centers.find((c) => c._id === newDoctor.centerId)?.name || centerSearch}`
                          : "Type and select a valid center name"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Specialization</Label>
                      <Input
                        className="h-11 rounded-xl"
                        value={newDoctor.specialization}
                        onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                        placeholder="Enter specialization"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Clinic</Label>
                      <Input
                        className="h-11 rounded-xl"
                        value={newDoctor.clinic}
                        onChange={(e) => setNewDoctor({ ...newDoctor, clinic: e.target.value })}
                        placeholder="Enter clinic / department"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Fee</Label>
                      <Input
                        type="number"
                        className="h-11 rounded-xl"
                        value={newDoctor.fee}
                        onChange={(e) => setNewDoctor({ ...newDoctor, fee: e.target.value })}
                        placeholder="Consultation fee"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        className="h-11 rounded-xl"
                        value={newDoctor.startTime}
                        onChange={(e) => setNewDoctor({ ...newDoctor, startTime: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        className="h-11 rounded-xl"
                        value={newDoctor.endTime}
                        onChange={(e) => setNewDoctor({ ...newDoctor, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Session Time (minutes)</Label>
                      <Input
                        type="number"
                        className="h-11 rounded-xl"
                        value={newDoctor.sessionTime}
                        onChange={(e) => setNewDoctor({ ...newDoctor, sessionTime: e.target.value })}
                        placeholder="30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Slot Date</Label>
                      <Input
                        type="date"
                        className="h-11 rounded-xl"
                        value={newDoctor.date}
                        onChange={(e) => setNewDoctor({ ...newDoctor, date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleAddDoctor}
                      disabled={submitting || loadingCenters}
                      className="h-11 rounded-xl px-6"
                    >
                      {submitting ? "Creating..." : "Add Doctor"}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Doctors</p>
              <p className="mt-2 text-2xl font-bold">{loading ? "--" : doctorsList.length}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Active Doctors</p>
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

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card className="rounded-3xl border shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Doctor Directory</h2>
              <p className="text-sm text-muted-foreground">
                Search, filter, edit, and manage doctor availability from one place.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
              <div className="relative w-full xl:min-w-[300px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search doctor, phone, clinic, center..."
                  className="h-11 rounded-xl pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="relative w-full xl:min-w-[260px]">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  list="doctor-center-filter-options"
                  placeholder="Filter by center name..."
                  className="h-11 rounded-xl pl-10"
                  value={doctorCenterFilter}
                  onChange={(e) => setDoctorCenterFilter(e.target.value)}
                  autoComplete="off"
                />
                <datalist id="doctor-center-filter-options">
                  {filteredDoctorCenterSuggestions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <Select value={specFilter} onValueChange={setSpecFilter}>
                <SelectTrigger className="h-11 w-full rounded-xl xl:w-56">
                  <SelectValue placeholder="Specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specializations</SelectItem>
                  {specializations.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading doctors...
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center">
                <UserRound className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No doctors found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try changing the search or filter settings.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((doc) => (
                  <Card
                    key={doc.id}
                    className="group h-full rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <CardHeader className="space-y-4 pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                              <Stethoscope className="h-5 w-5 text-primary" />
                            </div>

                            <div className="min-w-0">
                              <CardTitle className="truncate text-base font-semibold">
                                {doc.name}
                              </CardTitle>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {doc.specialization || "No specialization"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Badge
                          variant={doc.isActive ? "default" : "secondary"}
                          className="rounded-full px-3 py-1 text-[11px]"
                        >
                          {doc.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="space-y-2 rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                          <Building2 className="mt-0.5 h-4 w-4 shrink-0" />
                          <span className="break-words">{doc.clinic || "No clinic"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 shrink-0" />
                          <span>LKR {Number(doc.fee || 0).toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span>{doc.phone || "No phone"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>
                            {doc.startTime} - {doc.endTime}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span className="break-words">{getCenterDisplayName(doc)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 shrink-0" />
                          <span>{doc.sessionTime} min sessions</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex items-center gap-3 rounded-xl border bg-background px-3 py-2">
                          <Switch
                            checked={doc.isActive}
                            disabled={togglingId === doc.id}
                            onCheckedChange={() => toggleActive(doc)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {togglingId === doc.id
                              ? "Updating..."
                              : doc.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl"
                            onClick={() => setSelectedDoctor(doc)}
                          >
                            <Edit className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 rounded-xl"
                            onClick={() => setShowSlotsDialog(doc)}
                          >
                            <Clock className="mr-1.5 h-3.5 w-3.5" />
                            Slots
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
        <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="border-b bg-background px-6 py-5">
            <DialogTitle className="text-xl">Edit Doctor</DialogTitle>
            <DialogDescription>
              Update doctor profile details, schedule, and assigned center.
            </DialogDescription>
          </DialogHeader>

          {selectedDoctor && (
            <div className="max-h-[80vh] overflow-y-auto px-6 pb-6">
              <div className="space-y-6 py-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      className="h-11 rounded-xl"
                      value={editDoctor.name}
                      onChange={(e) => setEditDoctor({ ...editDoctor, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Center ID</Label>
                    <Input
                      className="h-11 rounded-xl"
                      value={editDoctor.centerId}
                      onChange={(e) => setEditDoctor({ ...editDoctor, centerId: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Specialization</Label>
                    <Input
                      className="h-11 rounded-xl"
                      value={editDoctor.specialization}
                      onChange={(e) =>
                        setEditDoctor({ ...editDoctor, specialization: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Clinic</Label>
                    <Input
                      className="h-11 rounded-xl"
                      value={editDoctor.clinic}
                      onChange={(e) => setEditDoctor({ ...editDoctor, clinic: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Fee</Label>
                    <Input
                      type="number"
                      className="h-11 rounded-xl"
                      value={editDoctor.fee}
                      onChange={(e) => setEditDoctor({ ...editDoctor, fee: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      className="h-11 rounded-xl"
                      value={editDoctor.phone}
                      onChange={(e) => setEditDoctor({ ...editDoctor, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Session Time</Label>
                    <Input
                      type="number"
                      className="h-11 rounded-xl"
                      value={editDoctor.sessionTime}
                      onChange={(e) =>
                        setEditDoctor({ ...editDoctor, sessionTime: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      className="h-11 rounded-xl"
                      value={editDoctor.startTime}
                      onChange={(e) => setEditDoctor({ ...editDoctor, startTime: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      className="h-11 rounded-xl"
                      value={editDoctor.endTime}
                      onChange={(e) => setEditDoctor({ ...editDoctor, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleUpdateDoctor}
                    disabled={submitting}
                    className="h-11 rounded-xl px-6"
                  >
                    {submitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!showSlotsDialog} onOpenChange={() => setShowSlotsDialog(null)}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="border-b bg-background px-6 py-5">
            <DialogTitle className="text-xl">
              Available Slots — {showSlotsDialog?.name}
            </DialogTitle>
            <DialogDescription>
              Preview generated time slots based on the doctor's configured schedule.
            </DialogDescription>
          </DialogHeader>

          {showSlotsDialog && (
            <div className="px-6 pb-6">
              <div className="space-y-5 py-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Time Range</p>
                    <p className="mt-1 text-sm font-semibold">
                      {showSlotsDialog.startTime} - {showSlotsDialog.endTime}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Session Time</p>
                    <p className="mt-1 text-sm font-semibold">
                      {showSlotsDialog.sessionTime} minutes
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Total Slots</p>
                    <p className="mt-1 text-sm font-semibold">
                      {generateSlots(showSlotsDialog).length}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border p-4">
                  <p className="mb-3 text-sm font-semibold">Generated Slots</p>

                  {generateSlots(showSlotsDialog).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {generateSlots(showSlotsDialog).map((slot) => (
                        <Badge
                          key={slot}
                          variant="outline"
                          className="rounded-full px-3 py-1.5 text-xs"
                        >
                          {slot}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No slots can be generated.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}