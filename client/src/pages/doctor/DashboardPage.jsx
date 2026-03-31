import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Users, ClipboardList, Calendar, DollarSign, Clock, Stethoscope, Activity, Loader2, CheckCircle2, CircleOff, CalendarDays, Mail, Phone, Building2, CalendarClock, Ban, } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
const DAY_LABELS = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
};
function getArrayFromResponse(data) {
    if (Array.isArray(data))
        return data;
    if (Array.isArray(data?.items))
        return data.items;
    if (Array.isArray(data?.appointments))
        return data.appointments;
    if (Array.isArray(data?.prescriptions))
        return data.prescriptions;
    if (Array.isArray(data?.slots))
        return data.slots;
    if (Array.isArray(data?.data))
        return data.data;
    return [];
}
function getDoctorFromResponse(data) {
    if (!data)
        return null;
    if (data.doctor)
        return data.doctor;
    if (data.data?.doctor)
        return data.data.doctor;
    if (data.data && !Array.isArray(data.data))
        return data.data;
    if (!Array.isArray(data))
        return data;
    return null;
}
function getTodayDate() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
function getDoctorId(doc) {
    if (!doc)
        return "";
    return doc._id || doc.id || "";
}
function getAppointmentUserId(item) {
    if (!item?.userId)
        return "";
    if (typeof item.userId === "string")
        return item.userId;
    return item.userId._id || item.userId.id || "";
}
function formatToday(dateStr) {
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime()))
        return dateStr;
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}
function getDayKeyFromDateString(dateStr) {
    const d = new Date(`${dateStr}T00:00:00`);
    const day = d.getDay();
    const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    return map[day];
}
function formatDateLabel(dateStr) {
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime()))
        return dateStr;
    return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}
export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [doctor, setDoctor] = useState(null);
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
    const today = getTodayDate();
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
                const [appointmentsRes, prescriptionsRes, slotsRes] = await Promise.all([
                    apiFetch("/appointments/doctor/me").catch(() => null),
                    apiFetch("/prescriptions/doctor/me").catch(() => null),
                    doctorId
                        ? apiFetch(`/slots?doctorId=${doctorId}&date=${today}`).catch(() => null)
                        : Promise.resolve(null),
                ]);
                const appointments = appointmentsRes
                    ? getArrayFromResponse(appointmentsRes)
                    : [];
                const prescriptions = prescriptionsRes
                    ? getArrayFromResponse(prescriptionsRes)
                    : [];
                const slots = slotsRes ? getArrayFromResponse(slotsRes) : [];
                const uniquePatients = new Set(appointments.map((a) => getAppointmentUserId(a)).filter(Boolean));
                const todaysAppointments = appointments.filter((a) => {
                    if (!a.slotId || typeof a.slotId === "string")
                        return false;
                    return a.slotId.date === today;
                });
                const completedToday = todaysAppointments.filter((a) => a.status === "completed").length;
                const noShowToday = todaysAppointments.filter((a) => a.status === "no_show").length;
                const availableSlots = slots.filter((slot) => {
                    if (slot?.isActive === false)
                        return false;
                    if (slot?.isBooked === false)
                        return true;
                    if (slot?.available === true)
                        return true;
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
            }
            catch (err) {
                toast.error(err.message || "Failed to load dashboard");
            }
            finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, [today]);
    const handleStatusToggle = async (checked) => {
        setIsActive(checked);
        setUpdatingStatus(true);
        try {
            await apiFetch("/doctors/me", {
                method: "PATCH",
                body: JSON.stringify({
                    isActive: checked,
                }),
            });
            setDoctor((prev) => (prev ? { ...prev, isActive: checked } : prev));
            toast.success(`Doctor status updated to ${checked ? "Active" : "Inactive"}`);
        }
        catch (err) {
            setIsActive(!checked);
            toast.error(err.message || "Failed to update status");
        }
        finally {
            setUpdatingStatus(false);
        }
    };
    const cards = useMemo(() => [
        {
            label: "Patients",
            value: stats.patients,
            icon: Users,
            iconWrap: "bg-primary/10",
            iconColor: "text-primary",
        },
        {
            label: "Prescriptions",
            value: stats.prescriptions,
            icon: ClipboardList,
            iconWrap: "bg-sky-500/10",
            iconColor: "text-sky-600",
        },
        {
            label: "Available Slots Today",
            value: `${stats.availableSlots}/${stats.totalSlots}`,
            icon: Calendar,
            iconWrap: "bg-emerald-500/10",
            iconColor: "text-emerald-600",
        },
        {
            label: "Consultation Fee",
            value: `Rs. ${stats.fee.toLocaleString()}`,
            icon: DollarSign,
            iconWrap: "bg-amber-500/10",
            iconColor: "text-amber-600",
        },
    ], [stats]);
    const workingDays = useMemo(() => doctor?.workingDays || [], [doctor]);
    const holidayDates = useMemo(() => doctor?.holidayDates || [], [doctor]);
    const todayDayKey = useMemo(() => getDayKeyFromDateString(today), [today]);
    const isWorkingDayToday = useMemo(() => {
        if (!workingDays.length)
            return true;
        return workingDays.includes(todayDayKey);
    }, [workingDays, todayDayKey]);
    const isHolidayToday = useMemo(() => holidayDates.includes(today), [holidayDates, today]);
    if (loading) {
        return (<div className="space-y-6 p-1 md:p-2">
        <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
          Loading dashboard...
        </div>
      </div>);
    }
    if (!doctor) {
        return (<div className="space-y-6 p-1 md:p-2">
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Stethoscope className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/>
          <p className="text-sm font-medium">Doctor data not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Unable to load your dashboard information.
          </p>
        </div>
      </div>);
    }
    return (<div className="space-y-8 p-1 md:p-2">
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5"/>
              Doctor Dashboard
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {doctor.fullName || doctor.name || "Doctor"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Here’s your daily overview including patients, prescriptions,
                slot activity, working days, and holiday configuration.
              </p>
            </div>
          </div>

          <Card className="w-full max-w-md rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Stethoscope className="h-7 w-7 text-primary"/>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">
                    {doctor.fullName || doctor.name || "Doctor"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {doctor.specialization || "No specialization"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {doctor.clinic || "No clinic"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={isActive} disabled={updatingStatus} onCheckedChange={handleStatusToggle}/>
                  <Badge variant="outline" className={isActive
            ? "rounded-full border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
            : "rounded-full border-destructive/30 bg-destructive/10 text-destructive"}>
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((stat) => (<Card key={stat.label} className="rounded-2xl border shadow-none">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                  </div>

                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.iconWrap}`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`}/>
                  </div>
                </div>
              </CardContent>
            </Card>))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_1fr]">
        <Card className="rounded-3xl border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Profile Summary</CardTitle>
            <p className="text-sm text-muted-foreground">
              Quick view of your current profile and schedule information.
            </p>
          </CardHeader>

          <CardContent className="space-y-3 pt-3">
            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4"/>
                  Name
                </div>
                <span className="max-w-[55%] truncate text-right text-sm font-semibold">
                  {doctor.fullName || doctor.name || "-"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4"/>
                  Email
                </div>
                <span className="max-w-[55%] truncate text-right text-sm font-semibold">
                  {doctor.email || "-"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4"/>
                  Phone
                </div>
                <span className="max-w-[55%] truncate text-right text-sm font-semibold">
                  {doctor.phone || "-"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Stethoscope className="h-4 w-4"/>
                  Specialization
                </div>
                <span className="max-w-[55%] truncate text-right text-sm font-semibold">
                  {doctor.specialization || "-"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4"/>
                  Clinic
                </div>
                <span className="max-w-[55%] truncate text-right text-sm font-semibold">
                  {doctor.clinic || "-"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4"/>
                  Fee
                </div>
                <span className="max-w-[55%] truncate text-right text-sm font-semibold">
                  Rs. {Number(doctor.fee || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-3xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary"/>
                Today Overview
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Performance snapshot for {formatToday(today)}.
              </p>
            </CardHeader>

            <CardContent className="space-y-3 pt-3">
              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">Start Time</span>
                <span className="text-sm font-semibold">{doctor.startTime || "-"}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">End Time</span>
                <span className="text-sm font-semibold">{doctor.endTime || "-"}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">Session Duration</span>
                <span className="text-sm font-semibold">
                  {doctor.sessionTime || 0} min
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">Today&apos;s Appointments</span>
                <span className="text-sm font-semibold">{stats.todayAppointments}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">Completed Today</span>
                <span className="text-sm font-semibold">{stats.completedToday}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">No Show Today</span>
                <span className="text-sm font-semibold">{stats.noShowToday}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">Available Slots</span>
                <span className="text-sm font-semibold">
                  {stats.availableSlots} of {stats.totalSlots}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-primary"/>
                Availability Summary
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Working-day and holiday settings used for slot generation.
              </p>
            </CardHeader>

            <CardContent className="space-y-4 pt-3">
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Working Days</p>
                <div className="flex flex-wrap gap-2">
                  {workingDays.length ? (workingDays.map((day) => (<Badge key={day} variant="outline" className="rounded-full px-3 py-1">
                        {DAY_LABELS[day] || day}
                      </Badge>))) : (<span className="text-sm font-semibold">-</span>)}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-muted-foreground">Holiday Dates</p>
                <div className="flex flex-wrap gap-2">
                  {holidayDates.length ? (holidayDates.slice(0, 5).map((date) => (<Badge key={date} variant="outline" className="rounded-full px-3 py-1">
                        {formatDateLabel(date)}
                      </Badge>))) : (<span className="text-sm font-semibold">No holidays set</span>)}
                  {holidayDates.length > 5 ? (<Badge variant="outline" className="rounded-full px-3 py-1">
                      +{holidayDates.length - 5} more
                    </Badge>) : null}
                </div>
              </div>

              {isHolidayToday ? (<div className="flex items-center justify-between rounded-2xl border bg-amber-500/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <Ban className="h-4 w-4"/>
                    Today is a holiday
                  </div>
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    Off
                  </span>
                </div>) : !isWorkingDayToday ? (<div className="flex items-center justify-between rounded-2xl border bg-primary/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <CalendarClock className="h-4 w-4"/>
                    Outside working days
                  </div>
                  <span className="text-sm font-semibold text-primary">Off</span>
                </div>) : (<div className="flex items-center justify-between rounded-2xl border bg-green-500/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4"/>
                    Working day active
                  </div>
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    On
                  </span>
                </div>)}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary"/>
                Status Summary
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Quick indicators for today’s workflow.
              </p>
            </CardHeader>

            <CardContent className="space-y-3 pt-3">
              <div className="flex items-center justify-between rounded-2xl border bg-green-500/10 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4"/>
                  Completed
                </div>
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {stats.completedToday}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-destructive/10 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <CircleOff className="h-4 w-4"/>
                  No Show
                </div>
                <span className="text-sm font-semibold text-destructive">
                  {stats.noShowToday}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-primary/10 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Calendar className="h-4 w-4"/>
                  Active Slots
                </div>
                <span className="text-sm font-semibold text-primary">
                  {stats.availableSlots}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);
}
