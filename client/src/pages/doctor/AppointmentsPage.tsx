import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Calendar as CalIcon,
  CalendarDays,
  Loader2,
  Stethoscope,
  CheckCircle2,
  Lock,
  CircleOff,
  CalendarClock,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

type DoctorData = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  mustChangePassword: boolean;
  name?: string;
  specialization?: string;
  clinic?: string;
  fee?: number;
  startTime?: string;
  endTime?: string;
  sessionTime?: number;
  isActive?: boolean;
  centerId?: string | null;
  workingDays?: string[];
  holidayDates?: string[];
};

type SlotData = {
  _id?: string;
  id?: string;
  startTime: string;
  endTime?: string;
  isBooked?: boolean;
  isActive?: boolean;
};

const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function getTodayDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getArrayFromResponse(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.slots)) return data.slots;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function formatToday(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getSlotStatus(slot: SlotData) {
  if (slot.isActive === false) return "inactive";
  if (slot.isBooked) return "booked";
  return "available";
}

function getDayKeyFromDateString(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[day];
}

function formatDateLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function Appointments() {
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [slots, setSlots] = useState<SlotData[]>([]);

  const today = getTodayDate();

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);

        const doctorRes = await apiFetch("/doctors/me");
        const doc = doctorRes.doctor as DoctorData;
        setDoctor(doc);

        const slotRes = await apiFetch(`/slots?doctorId=${doc.id}&date=${today}`);
        const slotItems = getArrayFromResponse(slotRes);

        setSlots(slotItems);
      } catch (err: any) {
        toast.error(err.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [today]);

  const sortedSlots = useMemo(() => {
    return [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots]);

  const availableCount = useMemo(
    () => sortedSlots.filter((slot) => getSlotStatus(slot) === "available").length,
    [sortedSlots]
  );

  const bookedCount = useMemo(
    () => sortedSlots.filter((slot) => getSlotStatus(slot) === "booked").length,
    [sortedSlots]
  );

  const inactiveCount = useMemo(
    () => sortedSlots.filter((slot) => getSlotStatus(slot) === "inactive").length,
    [sortedSlots]
  );

  const workingDays = useMemo(() => doctor?.workingDays || [], [doctor]);
  const holidayDates = useMemo(() => doctor?.holidayDates || [], [doctor]);

  const todayDayKey = useMemo(() => getDayKeyFromDateString(today), [today]);

  const isWorkingDayToday = useMemo(() => {
    if (!workingDays.length) return true;
    return workingDays.includes(todayDayKey);
  }, [workingDays, todayDayKey]);

  const isHolidayToday = useMemo(() => {
    return holidayDates.includes(today);
  }, [holidayDates, today]);

  const scheduleNotice = useMemo(() => {
    if (!doctor?.isActive) {
      return {
        title: "Schedule is inactive",
        text: "Your doctor profile is currently inactive, so active slots may not be available.",
        icon: <CircleOff className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />,
      };
    }

    if (isHolidayToday) {
      return {
        title: "Today is marked as a holiday",
        text: "This date is included in your holiday list, so no active booking schedule is expected for today.",
        icon: <Ban className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />,
      };
    }

    if (!isWorkingDayToday) {
      return {
        title: "Today is outside your working days",
        text: "This day is not included in your configured working days, so no active booking schedule is expected for today.",
        icon: <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />,
      };
    }

    return {
      title: "Schedule is read-only",
      text: "Your availability is based on your configured working hours, working days, and holidays.",
      icon: <CalIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />,
    };
  }, [doctor?.isActive, isHolidayToday, isWorkingDayToday]);

  if (loading) {
    return (
      <div className="space-y-6 p-1 md:p-2">
        <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading appointments...
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="space-y-6 p-1 md:p-2">
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Stethoscope className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Doctor data not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Unable to load doctor schedule details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1 md:p-2">
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Daily Appointment Schedule
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">Today&apos;s Schedule</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Review your working hours, configured availability, and today&apos;s
                generated time slots in one place.
              </p>
            </div>
          </div>

          <Card className="w-full max-w-md rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Stethoscope className="h-7 w-7 text-primary" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">
                    {doctor.name || doctor.fullName || "Doctor"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {doctor.specialization || "Medical Practitioner"}
                  </p>
                  <Badge className="mt-2 rounded-full px-3 py-1">
                    {doctor.isActive ? "Active Schedule" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Working Hours</p>
              <p className="mt-2 text-lg font-bold">
                {doctor.startTime || "-"} - {doctor.endTime || "-"}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Session Time</p>
              <p className="mt-2 text-lg font-bold">{doctor.sessionTime || 0} min</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Available Slots</p>
              <p className="mt-2 text-lg font-bold">{availableCount}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Booked Slots</p>
              <p className="mt-2 text-lg font-bold">{bookedCount}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Working Days</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {workingDays.length ? (
                  workingDays.map((day) => (
                    <Badge key={day} variant="outline" className="rounded-full px-3 py-1">
                      {DAY_LABELS[day] || day}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">-</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Holiday Dates</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {holidayDates.length ? (
                  holidayDates.slice(0, 6).map((date) => (
                    <Badge key={date} variant="outline" className="rounded-full px-3 py-1">
                      {formatDateLabel(date)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">No holidays set</span>
                )}
                {holidayDates.length > 6 ? (
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    +{holidayDates.length - 6} more
                  </Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-3xl border border-primary/20 shadow-sm">
        <CardContent className="flex items-start gap-3 p-5 text-sm">
          {scheduleNotice.icon}
          <div>
            <p className="font-medium text-foreground">{scheduleNotice.title}</p>
            <p className="mt-1 text-muted-foreground">{scheduleNotice.text}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Slot Overview
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Schedule for {formatToday(today)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 rounded-full border px-3 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Available
              </span>
              <span className="flex items-center gap-1.5 rounded-full border px-3 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Booked
              </span>
              <span className="flex items-center gap-1.5 rounded-full border px-3 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/50" />
                Inactive
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-3">
          {sortedSlots.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No slots found for today</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This may be because today is not a working day, is a holiday, or no slots were generated yet.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedSlots.map((slot, index) => {
                  const status = getSlotStatus(slot);

                  const statusUI =
                    status === "booked"
                      ? {
                          badge: "Booked",
                          icon: <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
                          cardClass:
                            "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15",
                          badgeClass:
                            "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                          subText: "This session is already reserved",
                        }
                      : status === "inactive"
                      ? {
                          badge: "Inactive",
                          icon: <CircleOff className="h-4 w-4 text-muted-foreground" />,
                          cardClass: "border-muted bg-muted/30 hover:bg-muted/40",
                          badgeClass: "border-muted bg-muted text-muted-foreground",
                          subText: "This slot is not active",
                        }
                      : {
                          badge: "Available",
                          icon: (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ),
                          cardClass:
                            "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15",
                          badgeClass:
                            "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                          subText: "Open for booking",
                        };

                  return (
                    <div
                      key={slot._id || slot.id || `${slot.startTime}-${index}`}
                      className={`rounded-2xl border p-4 transition-colors ${statusUI.cardClass}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold">{slot.startTime}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {slot.endTime ? `Ends at ${slot.endTime}` : "Session time slot"}
                          </p>
                        </div>

                        <div className="shrink-0">{statusUI.icon}</div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <Badge
                          variant="outline"
                          className={`rounded-full text-[11px] ${statusUI.badgeClass}`}
                        >
                          {statusUI.badge}
                        </Badge>

                        <span className="text-[11px] text-muted-foreground">#{index + 1}</span>
                      </div>

                      <p className="mt-3 text-xs text-muted-foreground">{statusUI.subText}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">Total Slots</p>
                  <p className="mt-1 text-base font-semibold">{sortedSlots.length}</p>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">Booked</p>
                  <p className="mt-1 text-base font-semibold">{bookedCount}</p>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="mt-1 text-base font-semibold">{inactiveCount}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}