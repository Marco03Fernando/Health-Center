import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SlotPicker } from "@/components/SlotPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import {
  MapPin,
  Briefcase,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  CalendarDays,
  Ban,
  CalendarClock,
} from "lucide-react";

type Doctor = {
  _id: string;
  name: string;
  specialization: string;
  clinic?: string;
  fee?: number;
  phone?: string;
  centerId?: string | { _id?: string; id?: string; name?: string };
  startTime?: string;
  endTime?: string;
  sessionTime?: number;
  workingDays?: string[];
  holidayDates?: string[];
  isActive?: boolean;
};

type Slot = {
  _id: string;
  date: string;
  startTime: string;
  endTime?: string;
  isBooked?: boolean;
  isActive?: boolean;
  doctorId?: string;
  centerId?: string;
};

type MeResponse = {
  user?: {
    _id?: string;
    id?: string;
    fullName?: string;
    email?: string;
    role?: string;
  };
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

function getArrayFromResponse(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.slots)) return data.slots;
  return [];
}

function getTodayDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDayKeyFromDateString(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay();
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[day];
}

function normalizeWorkingDays(workingDays?: string[]) {
  const valid = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  if (!Array.isArray(workingDays) || workingDays.length === 0) {
    return ["mon", "tue", "wed", "thu", "fri"];
  }

  const cleaned = [
    ...new Set(
      workingDays
        .map((d) => String(d).trim().toLowerCase())
        .filter((d) => valid.includes(d))
    ),
  ];

  return cleaned.length ? cleaned : ["mon", "tue", "wed", "thu", "fri"];
}

function normalizeHolidayDates(holidayDates?: string[]) {
  if (!Array.isArray(holidayDates) || holidayDates.length === 0) return [];
  return [...new Set(holidayDates.map((d) => String(d).trim()).filter(Boolean))];
}

function isDateAllowedBySchedule(
  date: string,
  workingDays: string[],
  holidayDates: string[]
) {
  if (!date) return false;
  if (holidayDates.includes(date)) return false;

  const dayKey = getDayKeyFromDateString(date);
  return workingDays.includes(dayKey);
}

function getNextAllowedDate(
  startDate: string,
  workingDays: string[],
  holidayDates: string[],
  limit = 120
) {
  const base = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return startDate;

  for (let i = 0; i < limit; i += 1) {
    const current = new Date(base);
    current.setDate(base.getDate() + i);

    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    const candidate = `${yyyy}-${mm}-${dd}`;

    if (isDateAllowedBySchedule(candidate, workingDays, holidayDates)) {
      return candidate;
    }
  }

  return startDate;
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const DoctorProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [userId, setUserId] = useState<string>("");

  const [date, setDate] = useState(getTodayDate());
  const [slot, setSlot] = useState<string | null>(null);
  const [selectedSlotObj, setSelectedSlotObj] = useState<Slot | null>(null);
  const [note, setNote] = useState("");

  const [step, setStep] = useState<"info" | "book" | "confirm" | "success">("info");

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadDoctor() {
      if (!id) return;

      try {
        setLoadingDoctor(true);
        setError("");

        const res = await apiFetch(`/doctors/${id}`);
        const raw = res?.doctor || res?.data?.doctor || res?.data || res;

        if (!ignore) {
          const nextDoctor: Doctor = {
            _id: raw?._id || raw?.id || "",
            name: raw?.name || "",
            specialization: raw?.specialization || "",
            clinic: raw?.clinic || "",
            fee: raw?.fee || 0,
            phone: raw?.phone || "",
            centerId: raw?.centerId,
            startTime: raw?.startTime,
            endTime: raw?.endTime,
            sessionTime: raw?.sessionTime,
            workingDays: normalizeWorkingDays(raw?.workingDays),
            holidayDates: normalizeHolidayDates(raw?.holidayDates),
            isActive: raw?.isActive !== false,
          };

          setDoctor(nextDoctor);

          const nextValidDate = getNextAllowedDate(
            getTodayDate(),
            nextDoctor.workingDays || [],
            nextDoctor.holidayDates || []
          );
          setDate(nextValidDate);
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.message || "Failed to load doctor");
        }
      } finally {
        if (!ignore) {
          setLoadingDoctor(false);
        }
      }
    }

    async function loadMe() {
      try {
        const res: MeResponse = await apiFetch("/auth/me");
        const currentUserId = res?.user?._id || res?.user?.id || "";
        if (!ignore) {
          setUserId(currentUserId);
        }
      } catch {
        if (!ignore) {
          setUserId("");
        }
      }
    }

    loadDoctor();
    loadMe();

    return () => {
      ignore = true;
    };
  }, [id]);

  const workingDays = useMemo(
    () => normalizeWorkingDays(doctor?.workingDays),
    [doctor?.workingDays]
  );

  const holidayDates = useMemo(
    () => normalizeHolidayDates(doctor?.holidayDates),
    [doctor?.holidayDates]
  );

  const isSelectedDateAllowed = useMemo(() => {
    if (!doctor) return true;
    return isDateAllowedBySchedule(date, workingDays, holidayDates);
  }, [doctor, date, workingDays, holidayDates]);

  const selectedDateReason = useMemo(() => {
    if (!date) return "";
    if (holidayDates.includes(date)) {
      return "This date is marked as a holiday for this doctor.";
    }

    const dayKey = getDayKeyFromDateString(date);
    if (!workingDays.includes(dayKey)) {
      return `This doctor only accepts bookings on ${workingDays
        .map((d) => DAY_LABELS[d] || d)
        .join(", ")}.`;
    }

    return "";
  }, [date, workingDays, holidayDates]);

  useEffect(() => {
    let ignore = false;

    async function loadSlots() {
      if (!id || !date) return;

      try {
        setLoadingSlots(true);
        setError("");
        setSlot(null);
        setSelectedSlotObj(null);

        if (!isSelectedDateAllowed) {
          if (!ignore) {
            setSlots([]);
          }
          return;
        }

        const params = new URLSearchParams({
          doctorId: id,
          date,
        });

        const res = await apiFetch(`/slots?${params.toString()}`);
        const items = getArrayFromResponse(res);

        const available = items.filter((s: any) => !s.isBooked && s.isActive !== false);

        if (!ignore) {
          setSlots(
            available.map((s: any) => ({
              _id: s._id || s.id,
              date: s.date,
              startTime: s.startTime,
              endTime: s.endTime,
              isBooked: s.isBooked,
              isActive: s.isActive,
              doctorId: s.doctorId,
              centerId: s.centerId,
            }))
          );
        }
      } catch (err: any) {
        if (!ignore) {
          setSlots([]);
          setError(err.message || "Failed to load slots");
        }
      } finally {
        if (!ignore) {
          setLoadingSlots(false);
        }
      }
    }

    if (step === "book") {
      loadSlots();
    }
  }, [id, date, step, isSelectedDateAllowed]);

  const slotLabels = useMemo(() => slots.map((s) => s.startTime), [slots]);

  useEffect(() => {
    if (!slot) {
      setSelectedSlotObj(null);
      return;
    }

    const found = slots.find((s) => s.startTime === slot) || null;
    setSelectedSlotObj(found);
  }, [slot, slots]);

  async function handleConfirm() {
    if (!doctor || !selectedSlotObj) return;

    if (!isSelectedDateAllowed) {
      setError(selectedDateReason || "Selected date is not available for this doctor.");
      return;
    }

    const resolvedCenterId =
      typeof doctor.centerId === "object"
        ? doctor.centerId?._id || doctor.centerId?.id || ""
        : doctor.centerId || "";

    if (!resolvedCenterId) {
      setError("Doctor center information is missing.");
      return;
    }

    if (!userId) {
      setError("Please log in before booking an appointment.");
      return;
    }

    try {
      setBooking(true);
      setError("");

      await apiFetch("/appointments", {
        method: "POST",
        body: JSON.stringify({
          centerId: resolvedCenterId,
          doctorId: doctor._id,
          userId,
          slotId: selectedSlotObj._id,
          note,
        }),
      });

      setStep("success");
    } catch (err: any) {
      setError(err.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  }

  if (loadingDoctor) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
        Loading doctor...
      </div>
    );
  }

  if (!doctor || !doctor._id) {
    return <div className="text-center py-12 text-muted-foreground">Doctor not found</div>;
  }

  const centerName =
    typeof doctor.centerId === "object"
      ? doctor.centerId?.name || doctor.clinic || "Center not available"
      : doctor.clinic || "Center not available";

  if (step === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Booking Confirmed!
        </h2>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Your appointment with {doctor.name} on {formatDisplayDate(date)} at {slot} has been
          booked successfully.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/user/appointments")}>View Appointments</Button>
          <Button variant="outline" onClick={() => navigate("/user/consult")}>
            Browse Doctors
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {error ? <div className="text-sm text-red-500">{error}</div> : null}

      <Card>
        <CardContent className="p-5">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-xl font-semibold shrink-0">
              {doctor.name?.charAt(0)?.toUpperCase() || "D"}
            </div>

            <div className="flex-1">
              <h1 className="font-display text-xl font-bold text-foreground">{doctor.name}</h1>
              <p className="text-primary font-medium">{doctor.specialization}</p>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {centerName}
                </span>

                {(doctor.startTime || doctor.endTime) && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {doctor.startTime || "--:--"} - {doctor.endTime || "--:--"}
                  </span>
                )}

                {doctor.sessionTime ? (
                  <span className="flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5" />
                    {doctor.sessionTime} min/session
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full">
                  <CalendarDays className="w-3.5 h-3.5 mr-1" />
                  {workingDays.map((d) => DAY_LABELS[d] || d).join(", ")}
                </Badge>

                {doctor.isActive === false ? (
                  <Badge variant="destructive" className="rounded-full">
                    Inactive
                  </Badge>
                ) : (
                  <Badge className="rounded-full">Available</Badge>
                )}
              </div>

              {holidayDates.length > 0 ? (
                <p className="text-xs text-muted-foreground mt-3">
                  Holiday dates are blocked automatically.
                </p>
              ) : null}

              <p className="font-display font-semibold text-foreground mt-3">
                Consultation Fee: Rs. {Number(doctor.fee || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {step === "info" && (
        <Button className="w-full" onClick={() => setStep("book")} disabled={doctor.isActive === false}>
          Book Appointment
        </Button>
      )}

      {step === "book" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Select Date & Time</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={getTodayDate()}
              />
            </div>

            <div className="rounded-xl border bg-muted/30 p-3 text-sm">
              <p className="font-medium text-foreground mb-1">Booking days</p>
              <p className="text-muted-foreground">
                This doctor accepts appointments only on{" "}
                <span className="font-medium text-foreground">
                  {workingDays.map((d) => DAY_LABELS[d] || d).join(", ")}
                </span>
                .
              </p>
            </div>

            {!isSelectedDateAllowed ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                <div className="flex items-start gap-2">
                  {holidayDates.includes(date) ? (
                    <Ban className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <CalendarClock className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  <div>{selectedDateReason}</div>
                </div>
              </div>
            ) : null}

            {loadingSlots ? (
              <div className="text-sm text-muted-foreground">Loading available slots...</div>
            ) : date ? (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Available Slots
                </label>

                {!isSelectedDateAllowed ? (
                  <div className="text-sm text-muted-foreground">
                    Select a valid working day to see available slots.
                  </div>
                ) : slotLabels.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No available slots for this date.
                  </div>
                ) : (
                  <SlotPicker slots={slotLabels} selected={slot} onSelect={setSlot} />
                )}
              </div>
            ) : null}

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Note (optional)
              </label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a short note"
              />
            </div>

            {date && slot && isSelectedDateAllowed && (
              <Button className="w-full" onClick={() => setStep("confirm")}>
                Continue
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {step === "confirm" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Confirm Booking</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doctor</span>
                <span className="font-medium text-foreground">{doctor.name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Specialization</span>
                <span className="text-foreground">{doctor.specialization}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Center</span>
                <span className="text-foreground">{centerName}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">{formatDisplayDate(date)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="text-foreground">{slot}</span>
              </div>

              {note ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Note</span>
                  <span className="text-foreground text-right">{note}</span>
                </div>
              ) : null}

              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-medium text-foreground">Fee</span>
                <span className="font-display font-semibold text-foreground">
                  Rs. {Number(doctor.fee || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("book")}>
                Back
              </Button>

              <Button className="flex-1" onClick={handleConfirm} disabled={booking}>
                {booking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorProfilePage;