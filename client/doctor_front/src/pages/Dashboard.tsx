import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Users, ClipboardList, Calendar, DollarSign, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

type DoctorData = {
  id?: string;
  _id?: string;
  userId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  mustChangePassword?: boolean;
  name?: string;
  specialization?: string;
  clinic?: string;
  fee?: number;
  startTime?: string;
  endTime?: string;
  sessionTime?: number;
  isActive?: boolean;
  centerId?: string | { _id?: string; id?: string } | null;
};

type AppointmentItem = {
  _id?: string;
  status?: string;
  userId?: {
    _id?: string;
    id?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  } | string;
  slotId?: {
    _id?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    isBooked?: boolean;
  } | string;
};

type PrescriptionItem = {
  _id?: string;
  status?: string;
  appointmentId?: string | { _id?: string };
};

type SlotItem = {
  _id?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  isBooked?: boolean;
  isActive?: boolean;
  available?: boolean;
};

function getArrayFromResponse(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.appointments)) return data.appointments;
  if (Array.isArray(data?.prescriptions)) return data.prescriptions;
  if (Array.isArray(data?.slots)) return data.slots;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getDoctorFromResponse(data: any): DoctorData | null {
  if (!data) return null;
  if (data.doctor) return data.doctor;
  if (data.data?.doctor) return data.data.doctor;
  if (data.data && !Array.isArray(data.data)) return data.data;
  if (!Array.isArray(data)) return data;
  return null;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getDoctorId(doc: DoctorData | null) {
  if (!doc) return "";
  return doc._id || doc.id || "";
}

function getCenterId(doc: DoctorData | null) {
  if (!doc?.centerId) return "";
  if (typeof doc.centerId === "string") return doc.centerId;
  return doc.centerId._id || doc.centerId.id || "";
}

function getAppointmentUserId(item: AppointmentItem) {
  if (!item?.userId) return "";
  if (typeof item.userId === "string") return item.userId;
  return item.userId._id || item.userId.id || "";
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [isActive, setIsActive] = useState(false);

  const [stats, setStats] = useState({
    patients: 0,
    prescriptions: 0,
    availableSlots: 0,
    totalSlots: 0,
    fee: 0,
    todayAppointments: 0,
    completedToday: 0,
    noShowToday: 0,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const doctorRes = await apiFetch("/doctors/me");
        const doc = getDoctorFromResponse(doctorRes);

        if (!doc) {
          throw new Error("Doctor data not found");
        }

        setDoctor(doc);
        setIsActive(!!doc.isActive);

        const doctorId = getDoctorId(doc);
        const centerId = getCenterId(doc);
        const today = getTodayDate();

        const [appointmentsRes, prescriptionsRes, slotsRes] = await Promise.all([
          apiFetch("/appointments/doctor/me").catch(() => null),
          apiFetch("/prescriptions/doctor/me").catch(() => null),
          doctorId
            ? apiFetch(`/slots?doctorId=${doctorId}&date=${today}`).catch(() => null)
            : Promise.resolve(null),
        ]);

        const appointments = appointmentsRes
          ? (getArrayFromResponse(appointmentsRes) as AppointmentItem[])
          : [];

        const prescriptions = prescriptionsRes
          ? (getArrayFromResponse(prescriptionsRes) as PrescriptionItem[])
          : [];

        const slots = slotsRes
          ? (getArrayFromResponse(slotsRes) as SlotItem[])
          : [];

        const uniquePatients = new Set(
          appointments.map((a) => getAppointmentUserId(a)).filter(Boolean)
        );

        const todaysAppointments = appointments.filter((a) => {
          if (!a.slotId || typeof a.slotId === "string") return false;
          return a.slotId.date === today;
        });

        const completedToday = todaysAppointments.filter(
          (a) => a.status === "completed"
        ).length;

        const noShowToday = todaysAppointments.filter(
          (a) => a.status === "no_show"
        ).length;

        const availableSlots = slots.filter((slot) => {
          if (slot?.isActive === false) return false;
          if (slot?.isBooked === false) return true;
          if (slot?.available === true) return true;
          return false;
        }).length;

        setStats({
          patients: uniquePatients.size,
          prescriptions: prescriptions.length,
          availableSlots,
          totalSlots: slots.length,
          fee: Number(doc.fee || 0),
          todayAppointments: todaysAppointments.length,
          completedToday,
          noShowToday,
        });
      } catch (err: any) {
        toast.error(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleStatusToggle = async (checked: boolean) => {
    setIsActive(checked);

    try {
      await apiFetch("/doctors/me", {
        method: "PATCH",
        body: JSON.stringify({
          isActive: checked,
        }),
      });

      setDoctor((prev) => (prev ? { ...prev, isActive: checked } : prev));
      toast.success(`Doctor status updated to ${checked ? "Active" : "Inactive"}`);
    } catch (err: any) {
      setIsActive(!checked);
      toast.error(err.message || "Failed to update status");
    }
  };

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  if (!doctor) {
    return <div className="p-6">Doctor data not found.</div>;
  }

  const cards = [
    {
      label: "Patients",
      value: stats.patients,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Prescriptions",
      value: stats.prescriptions,
      icon: ClipboardList,
      color: "text-info",
    },
    {
      label: "Available Slots Today",
      value: `${stats.availableSlots}/${stats.totalSlots}`,
      icon: Calendar,
      color: "text-success",
    },
    {
      label: "Consultation Fee",
      value: `Rs.${stats.fee}`,
      icon: DollarSign,
      color: "text-warning",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {doctor.fullName || doctor.name || "Doctor"}
          </h1>
          <p className="text-muted-foreground">
            {doctor.specialization || "No specialization"} · {doctor.clinic || "No clinic"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Status</span>
          <Switch checked={isActive} onCheckedChange={handleStatusToggle} />
          <Badge
            variant="outline"
            className={
              isActive
                ? "border-green-500/30 bg-green-500/10 text-green-600"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Name", doctor.fullName || doctor.name || "-"],
              ["Email", doctor.email || "-"],
              ["Phone", doctor.phone || "-"],
              ["Specialization", doctor.specialization || "-"],
              ["Clinic", doctor.clinic || "-"],
              ["Fee", `Rs.${doctor.fee || 0}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-right font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Today Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Start Time</span>
              <span className="text-right font-medium">{doctor.startTime || "-"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">End Time</span>
              <span className="text-right font-medium">{doctor.endTime || "-"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Session Duration</span>
              <span className="text-right font-medium">
                {doctor.sessionTime || 0} min
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Today's Appointments</span>
              <span className="text-right font-medium">{stats.todayAppointments}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Completed Today</span>
              <span className="text-right font-medium">{stats.completedToday}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">No Show Today</span>
              <span className="text-right font-medium">{stats.noShowToday}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Today's Available Slots</span>
              <span className="text-right font-medium">
                {stats.availableSlots} of {stats.totalSlots}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}