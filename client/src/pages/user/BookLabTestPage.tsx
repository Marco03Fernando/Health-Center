import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type DiagnosticTest = {
  _id: string;
  name: string;
  description?: string;
  instructions?: string;
  isActive?: boolean;
};

type Center = {
  _id: string;
  name: string;
  address?: string;
  district?: string;
};

type Slot = {
  _id: string;
  center: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: string;
};

const STEPS = [
  { label: "Test" },
  { label: "Lab" },
  { label: "Slot" },
  { label: "Confirm" },
];

// ─── Stepper Component ────────────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  const total = STEPS.length;
  const percent = total > 1 ? ((current - 1) / (total - 1)) * 100 : 0;

  return (
    <div className="w-full py-2 md:py-3">
      <div className="relative mb-3">
        <div className="hidden md:block absolute left-0 right-0 top-5 h-1 bg-primary/10 rounded-full" />
        <div
          className="hidden md:block absolute left-0 top-5 h-1 bg-primary rounded-full"
          style={{ width: `${percent}%`, transition: "width 260ms ease" }}
        />
        <div className="flex md:flex-row flex-col md:items-center gap-3 md:gap-6 justify-between">
          {STEPS.map((s, idx) => {
            const stepNum = idx + 1;
            const completed = stepNum < current;
            const active = stepNum === current;
            return (
              <div
                key={s.label}
                className="flex-1 flex md:flex-col items-center md:items-center md:justify-center md:text-center px-1 md:px-0"
              >
                <div className="relative flex items-center md:flex-col">
                  <div
                    className={`flex items-center justify-center w-9 h-9 md:w-12 md:h-12 rounded-full transition-transform duration-150 ${
                      completed
                        ? "bg-primary text-primary-foreground"
                        : active
                        ? "bg-background text-primary ring-4 ring-primary/20 shadow-md"
                        : "bg-background text-muted-foreground border border-border"
                    }`}
                  >
                    {completed ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 md:h-5 md:w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 00-1.414-1.414L7 12.172 4.707 9.879a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l9-9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span className="font-medium text-sm">{stepNum}</span>
                    )}
                  </div>
                  <div className="ml-2 md:ml-0 md:mt-2">
                    <div
                      className={`text-sm ${
                        active
                          ? "text-primary font-semibold"
                          : completed
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      } transition-colors duration-150`}
                    >
                      {s.label}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Mini Calendar Component ──────────────────────────────────────────────────

function MiniCalendar({
  slots,
  onSelectDate,
}: {
  slots: Slot[];
  onSelectDate: (d: Date) => void;
}) {
  const [month, setMonth] = useState(new Date());

  const getUTCDateString = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
      d.getUTCDate()
    ).padStart(2, "0")}`;
  };

  const localDateToString = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;

  const availableDates = new Set(
    slots
      .filter((s) => s.status === "AVAILABLE")
      .map((s) => getUTCDateString(s.slotDate))
  );

  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div className="p-4 bg-card border border-border rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-medium text-sm text-foreground">
          {month.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-muted-foreground py-1 font-medium">
            {d}
          </div>
        ))}
        {Array(start.getDay())
          .fill(0)
          .map((_, i) => (
            <div key={"pad" + i} />
          ))}
        {days.map((d) => {
          const dt = new Date(month.getFullYear(), month.getMonth(), d);
          const ds = localDateToString(dt);
          const isAvail = availableDates.has(ds);
          const isPast = dt < today;
          return (
            <button
              key={d}
              disabled={isPast || !isAvail}
              onClick={() => onSelectDate(dt)}
              className={`flex flex-col items-center justify-center h-9 rounded-lg transition-colors ${
                isPast
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : isAvail
                  ? "hover:bg-primary/10 text-foreground"
                  : "text-muted-foreground/50 bg-muted/30 cursor-not-allowed"
              }`}
            >
              <span>{d}</span>
              {isAvail && !isPast && (
                <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const BookLabTestPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [step, setStep] = useState(1);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Load tests and centers on mount
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [testsRes, centersRes] = await Promise.all([
          apiFetch("/lab/diagnostic-tests"),
          apiFetch("/centers"),
        ]);

        const testsArr: DiagnosticTest[] = Array.isArray(testsRes)
          ? testsRes
          : Array.isArray(testsRes?.data)
          ? testsRes.data
          : [];
        const centersArr: Center[] = Array.isArray(centersRes)
          ? centersRes
          : Array.isArray(centersRes?.data)
          ? centersRes.data
          : [];

        setTests(testsArr.filter((t) => t.isActive !== false));
        setCenters(centersArr);
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Fetch available slots when center changes
  useEffect(() => {
    if (!selectedCenter) {
      setSlots([]);
      setSelectedDate(null);
      setSelectedSlot(null);
      return;
    }
    setSelectedDate(null);
    setSelectedSlot(null);

    apiFetch(`/getAvailableAppointmentSlots/${selectedCenter}`)
      .then((res) => {
        setSlots(
          res?.availableSlots ||
            res?.data ||
            (Array.isArray(res) ? res : [])
        );
      })
      .catch(() => setSlots([]));
  }, [selectedCenter]);

  async function handleConfirm() {
    try {
      setSubmitting(true);
      setError("");

      const meRes = await apiFetch("/auth/me");
      const userId = meRes?.user?._id || meRes?.user?.id;

      if (!userId) {
        setError("Please log in first.");
        return;
      }

      const res = await apiFetch("/bookappointment", {
        method: "POST",
        body: JSON.stringify({
          slotId: selectedSlot,
          userId,
          diagnosticTestId: selectedTest,
        }),
      });

      const bookingId =
        res?.booking?._id || res?.booking?.id || res?._id || res?.id;
      navigate(`/user/lab-bookings/${bookingId}`);
    } catch (err: any) {
      setError(err.message || "Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const getUTCDateString = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
      d.getUTCDate()
    ).padStart(2, "0")}`;
  };

  const localDateToString = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;

  const availableForDate =
    selectedDate && selectedCenter
      ? slots.filter((s) => {
          if (
            s.center !== selectedCenter ||
            getUTCDateString(s.slotDate) !== localDateToString(selectedDate) ||
            s.status !== "AVAILABLE"
          )
            return false;

          // If the selected date is today, hide slots whose start time has already passed
          const todayStr = localDateToString(new Date());
          if (localDateToString(selectedDate) === todayStr) {
            const now = new Date();
            const [slotHour, slotMin] = s.startTime.split(":").map(Number);
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const slotMinutes = slotHour * 60 + slotMin;
            return slotMinutes > currentMinutes;
          }

          return true;
        })
      : [];

  const selectedTestObj = tests.find((t) => t._id === selectedTest);
  const selectedCenterObj = centers.find((c) => c._id === selectedCenter);
  const selectedSlotObj = slots.find((s) => s._id === selectedSlot);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/user/lab-bookings")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Book Lab Test
          </h1>
        </div>
        <p className="text-muted-foreground text-sm ml-11">
          Complete the steps below to book your diagnostic test
        </p>
        <div className="mt-6">
          <Stepper current={step} />
        </div>
      </div>

      {error ? (
        <div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
          {error}
        </div>
      ) : null}

      <div className="grid md:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="md:col-span-3">

          {/* Step 1 — Select Test */}
          {step === 1 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display font-semibold text-foreground mb-4">
                  Select Diagnostic Test
                </h2>
                <div className="space-y-3">
                  {tests.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No diagnostic tests available.
                    </p>
                  ) : (
                    tests.map((t) => (
                      <label
                        key={t._id}
                        className={`flex items-start p-3.5 border rounded-lg cursor-pointer transition-colors ${
                          selectedTest === t._id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="test"
                          checked={selectedTest === t._id}
                          onChange={() => setSelectedTest(t._id)}
                          className="mr-3 mt-1 accent-primary"
                        />
                        <div className="space-y-1">
                          <div className="font-medium text-foreground text-sm">
                            {t.name}
                          </div>
                          {t.description && (
                            <div className="text-xs text-muted-foreground">
                              {t.description}
                            </div>
                          )}
                          {t.instructions && (
                            <div className="text-xs text-primary/70 italic">
                              <span className="font-semibold not-italic">Prep: </span>
                              {t.instructions}
                            </div>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <div className="flex justify-end mt-5">
                  <Button disabled={!selectedTest} onClick={() => setStep(2)}>
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2 — Select Lab Center */}
          {step === 2 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display font-semibold text-foreground mb-4">
                  Select Lab Center
                </h2>
                <div className="space-y-3">
                  {centers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No lab centers available.
                    </p>
                  ) : (
                    centers.map((c) => (
                      <label
                        key={c._id}
                        className={`flex items-start p-3.5 border rounded-lg cursor-pointer transition-colors ${
                          selectedCenter === c._id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="center"
                          checked={selectedCenter === c._id}
                          onChange={() => setSelectedCenter(c._id)}
                          className="mr-3 mt-1 accent-primary"
                        />
                        <div>
                          <div className="font-medium text-foreground text-sm">
                            {c.name}
                          </div>
                          {(c.address || c.district) && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {[c.address, c.district].filter(Boolean).join(", ")}
                            </div>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <div className="flex justify-between mt-5">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    disabled={!selectedCenter}
                    onClick={() => setStep(3)}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3 — Choose Slot */}
          {step === 3 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display font-semibold text-foreground mb-4">
                  Choose Date &amp; Time Slot
                </h2>
                <div className="grid md:grid-cols-2 gap-5 items-start">
                  <div className="self-start">
                    <MiniCalendar
                      slots={slots.filter((s) => s.center === selectedCenter)}
                      onSelectDate={(d) => {
                        setSelectedDate(d);
                        setSelectedSlot(null);
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-medium text-sm text-foreground mb-3">
                      {selectedDate
                        ? `Slots on ${selectedDate.toDateString()}`
                        : "Select a highlighted date"}
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {availableForDate.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {selectedDate
                            ? "No available slots for this date."
                            : "Pick a date with a dot to see available slots."}
                        </p>
                      ) : (
                        availableForDate.map((s) => (
                          <div
                            key={s._id}
                            className={`p-3 border rounded-lg flex justify-between items-center transition-colors ${
                              selectedSlot === s._id
                                ? "ring-2 ring-primary/40 bg-primary/5 border-primary/30"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <div>
                              <div className="font-medium text-sm text-foreground">
                                {s.startTime} — {s.endTime}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Available
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSlot(s._id)}
                            >
                              Select
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex justify-between mt-5">
                      <Button variant="outline" onClick={() => setStep(2)}>
                        Back
                      </Button>
                      <Button
                        disabled={!selectedSlot}
                        onClick={() => setStep(4)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4 — Confirm */}
          {step === 4 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display font-semibold text-foreground mb-4">
                  Confirm Your Booking
                </h2>
                <div className="bg-muted/50 rounded-lg p-6 mb-5">
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm max-w-md mx-auto">
                    <dt className="text-muted-foreground">Diagnostic Test</dt>
                    <dd className="font-medium text-foreground">
                      {selectedTestObj?.name || "—"}
                    </dd>
                    <dt className="text-muted-foreground">Lab Center</dt>
                    <dd className="font-medium text-foreground">
                      {selectedCenterObj?.name || "—"}
                    </dd>
                    <dt className="text-muted-foreground">Date</dt>
                    <dd className="font-medium text-foreground">
                      {selectedDate?.toDateString() || "—"}
                    </dd>
                    <dt className="text-muted-foreground">Time Slot</dt>
                    <dd className="font-medium text-foreground">
                      {selectedSlotObj
                        ? `${selectedSlotObj.startTime} — ${selectedSlotObj.endTime}`
                        : "—"}
                    </dd>
                  </dl>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Edit
                  </Button>
                  <Button onClick={handleConfirm} disabled={submitting}>
                    {submitting ? "Confirming..." : "Confirm Booking"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Sidebar */}
        <aside className="md:col-span-1">
          <Card>
            <CardContent className="p-4 text-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-foreground">
                  Summary
                </h3>
                {step > 1 && (
                  <button
                    onClick={() => setStep(Math.max(1, step - 1))}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
              <dl className="space-y-2.5 text-xs">
                <div>
                  <dt className="text-muted-foreground">Test</dt>
                  <dd className="font-medium text-foreground mt-0.5">
                    {selectedTestObj?.name || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Lab</dt>
                  <dd className="font-medium text-foreground mt-0.5">
                    {selectedCenterObj?.name || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Date</dt>
                  <dd className="font-medium text-foreground mt-0.5">
                    {selectedDate?.toDateString() || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Slot</dt>
                  <dd className="font-medium text-foreground mt-0.5">
                    {selectedSlotObj ? selectedSlotObj.startTime : "—"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default BookLabTestPage;
