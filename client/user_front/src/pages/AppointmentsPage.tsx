import { useEffect, useState } from "react";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { AppointmentStatus } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiFetch } from "@/lib/api";

const filters: { label: string; value: AppointmentStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

type BackendAppointment = {
  _id?: string;
  id?: string;
  status?: string;
  note?: string;
  doctorId?: {
    _id?: string;
    id?: string;
    name?: string;
    specialization?: string;
    clinic?: string;
    fee?: number;
    centerId?: {
      _id?: string;
      id?: string;
      name?: string;
      location?: string;
      district?: string;
      address?: string;
      phone?: string;
    };
  } | string;
  centerId?: {
    _id?: string;
    id?: string;
    name?: string;
    location?: string;
    district?: string;
    address?: string;
    phone?: string;
  } | string;
  slotId?: {
    _id?: string;
    id?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  } | string;
};

type UiAppointment = {
  id: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  specialty: string;
  clinic: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  fee: number;
  note?: string;
};

function getArrayFromResponse(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.appointments)) return data.appointments;
  return [];
}

function mapAppointment(a: BackendAppointment): UiAppointment {
  const doctor =
    typeof a.doctorId === "object" && a.doctorId !== null ? a.doctorId : null;

  const centerFromDoctor =
    doctor && typeof doctor.centerId === "object" && doctor.centerId !== null
      ? doctor.centerId
      : null;

  const center =
    typeof a.centerId === "object" && a.centerId !== null
      ? a.centerId
      : centerFromDoctor;

  const slot =
    typeof a.slotId === "object" && a.slotId !== null ? a.slotId : null;

  return {
    id: a._id || a.id || "",
    doctorId: doctor?._id || doctor?.id || "",
    doctorName: doctor?.name || "Doctor not available",
    specialization: doctor?.specialization || "Not available",
    specialty: doctor?.specialization || "Not available",
    clinic: center?.name || doctor?.clinic || "Center not available",
    date: slot?.date || "Not available",
    time: slot?.startTime || "Not available",
    status: (a.status || "pending") as AppointmentStatus,
    fee: Number(doctor?.fee || 0),
    note: a.note || "",
  };
}

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState<UiAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AppointmentStatus | "all">("all");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");

      const meRes = await apiFetch("/auth/me");
      const userId = meRes?.user?._id || meRes?.user?.id;

      if (!userId) {
        setAppointments([]);
        setError("Please log in first.");
        return;
      }

      const res = await apiFetch(`/appointments/user/${userId}`);
      const items = getArrayFromResponse(res);

      setAppointments(items.map(mapAppointment));
    } catch (err: any) {
      setAppointments([]);
      setError(err.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  async function handleCancelAppointment(id: string) {
    try {
      setError("");

      const meRes = await apiFetch("/auth/me");
      const userId = meRes?.user?._id || meRes?.user?.id;

      if (!userId) {
        setError("Please log in first.");
        return;
      }

      await apiFetch(`/appointments/${id}/cancel?userId=${userId}`, {
        method: "DELETE",
      });

      setCancelId(null);
      await loadAppointments();
    } catch (err: any) {
      setError(err.message || "Failed to cancel appointment");
      setCancelId(null);
    }
  }

  const filtered = appointments.filter((a) => {
    const q = search.toLowerCase();

    const matchSearch =
      a.doctorName.toLowerCase().includes(q) ||
      a.clinic.toLowerCase().includes(q) ||
      a.specialization.toLowerCase().includes(q);

    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Appointments
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your appointments
        </p>
      </div>

      {error ? <div className="text-sm text-red-500">{error}</div> : null}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search appointments..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.value)}
            className="shrink-0"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading appointments...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No appointments found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              onCancel={(id) => setCancelId(id)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Cancel Appointment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your appointment will be cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (cancelId) handleCancelAppointment(cancelId);
              }}
            >
              Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppointmentsPage;