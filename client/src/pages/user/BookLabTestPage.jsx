import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowLeft, FlaskConical, MapPin, Clock, Check, Heart, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
const STEPS = [
  { label: "Test", icon: FlaskConical },
  { label: "Lab", icon: MapPin },
  { label: "Slot", icon: Clock },
  { label: "Confirm", icon: Check },
];
// ─── Stepper Component ────────────────────────────────────────────────────────
function Stepper({ current }) {
    const total = STEPS.length;
    const percent = total > 1 ? ((current - 1) / (total - 1)) * 100 : 0;
    return (<div className="w-full py-2 md:py-3">
      <div className="relative mb-3">
        <div className="hidden md:block absolute left-0 right-0 top-5 h-1 bg-primary/10 rounded-full"/>
        <div className="hidden md:block absolute left-0 top-5 h-1 bg-primary rounded-full" style={{ width: `${percent}%`, transition: "width 260ms ease" }}/>
        <div className="flex md:flex-row flex-col md:items-center gap-3 md:gap-6 justify-between">
          {STEPS.map((s, idx) => {
            const stepNum = idx + 1;
            const completed = stepNum < current;
            const active = stepNum === current;
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex-1 flex md:flex-col items-center md:items-center md:justify-center md:text-center px-1 md:px-0">
                <div className="relative flex items-center md:flex-col">
                  <div className={`flex items-center justify-center w-9 h-9 md:w-12 md:h-12 rounded-full transition-transform duration-150 ${completed
                    ? "bg-primary text-primary-foreground"
                    : active
                        ? "bg-background text-primary ring-4 ring-primary/20 shadow-md"
                        : "bg-background text-muted-foreground border border-border"}`}>
                    {completed ? (<Check className="h-4 w-4 md:h-5 md:w-5"/>) : (<Icon className="h-4 w-4 md:h-5 md:w-5"/>)}
                  </div>
                  <div className="ml-2 md:ml-0 md:mt-2">
                    <div className={`text-sm ${active
                    ? "text-primary font-semibold"
                    : completed
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"} transition-colors duration-150`}>
                      {s.label}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>);
}
// ─── Mini Calendar Component ──────────────────────────────────────────────────
function MiniCalendar({ slots, onSelectDate, }) {
    const [month, setMonth] = useState(new Date());
    const getUTCDateString = (dateStr) => {
        const d = new Date(dateStr);
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    };
    const localDateToString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const availableDates = new Set(slots
        .filter((s) => s.status === "AVAILABLE")
        .map((s) => getUTCDateString(s.slotDate)));
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    return (<div className="p-4 bg-card border border-border rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4"/>
        </button>
        <span className="font-medium text-sm text-foreground">
          {month.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </span>
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="w-4 h-4"/>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (<div key={d} className="text-center text-muted-foreground py-1 font-medium">
            {d}
          </div>))}
        {Array(start.getDay())
            .fill(0)
            .map((_, i) => (<div key={"pad" + i}/>))}
        {days.map((d) => {
            const dt = new Date(month.getFullYear(), month.getMonth(), d);
            const ds = localDateToString(dt);
            const isAvail = availableDates.has(ds);
            const isPast = dt < today;
            return (<button key={d} disabled={isPast || !isAvail} onClick={() => onSelectDate(dt)} className={`flex flex-col items-center justify-center h-9 rounded-lg transition-colors ${isPast
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : isAvail
                        ? "hover:bg-primary/10 text-foreground"
                        : "text-muted-foreground/50 bg-muted/30 cursor-not-allowed"}`}>
              <span>{d}</span>
              {isAvail && !isPast && (<span className="w-1 h-1 rounded-full bg-primary mt-0.5"/>)}
            </button>);
        })}
      </div>
    </div>);
}

// SummaryItem helper
function SummaryItem({ label, value, icon: Icon, active }) {
  return (
    <div className={`flex items-start gap-3 py-2 ${active ? "opacity-100 animate-in fade-in slide-in-from-left-2 duration-300" : "opacity-40"}`}>
      {Icon && (<div className="text-muted-foreground mt-0.5"><Icon className="w-4 h-4"/></div>)}
      <div className="flex-1">
        <div className="text-xs uppercase text-muted-foreground">{label}</div>
        <div className="text-sm font-medium text-foreground">{value || "—"}</div>
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
    const [tests, setTests] = useState([]);
    const [centers, setCenters] = useState([]);
    const [slots, setSlots] = useState([]);
    const [step, setStep] = useState(1);
    const [selectedTest, setSelectedTest] = useState(null);
    const [selectedCenter, setSelectedCenter] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    // Load tests and centers on mount
    useEffect(() => {
        async function init() {
            try {
                setLoading(true);
                const [testsRes, centersRes] = await Promise.all([
                    apiFetch("/lab/diagnostic-tests"),
                    apiFetch("/centers"),
                ]);
                const testsArr = Array.isArray(testsRes)
                    ? testsRes
                    : Array.isArray(testsRes?.data)
                        ? testsRes.data
                        : [];
                const centersArr = Array.isArray(centersRes)
                    ? centersRes
                    : Array.isArray(centersRes?.data)
                        ? centersRes.data
                        : [];
                setTests(testsArr.filter((t) => t.isActive !== false));
                setCenters(centersArr);
            }
            catch (err) {
                setError(err.message || "Failed to load data");
            }
            finally {
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
            setSlots(res?.availableSlots ||
                res?.data ||
                (Array.isArray(res) ? res : []));
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
            const bookingId = res?.booking?._id || res?.booking?.id || res?._id || res?.id;
            navigate(`/user/lab-bookings/${bookingId}`);
        }
        catch (err) {
            setError(err.message || "Failed to create booking. Please try again.");
        }
        finally {
            setSubmitting(false);
        }
    }
    const getUTCDateString = (dateStr) => {
        const d = new Date(dateStr);
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    };
    const localDateToString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const availableForDate = selectedDate && selectedCenter
        ? slots.filter((s) => {
            if (s.center !== selectedCenter ||
                getUTCDateString(s.slotDate) !== localDateToString(selectedDate) ||
                s.status !== "AVAILABLE")
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
    const summaryPercent = (step / STEPS.length) * 100;
    // Pre-encode heart SVG once to avoid embedding closing tags directly in JSX template literals
    const heartSvg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='black' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6.01 4.01 4 6.5 4 8.04 4 9.5 4.99 10 6.09 10.5 4.99 11.96 4 13.5 4 15.99 4 18 6.01 18 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/></svg>";
    const heartSvgEncoded = encodeURIComponent(heartSvg);
    const formatPrice = (t) => {
      const p = t?.price ?? t?.cost ?? t?.fee ?? null;
      if (p == null)
        return null;
      const n = Number(p);
      return Number.isNaN(n) ? String(p) : `Rs ${n.toFixed(2)}`;
    };
    if (loading) {
        return (<div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"/>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>);
    }
    return (<div key={step} className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="icon" onClick={() => navigate("/user/lab-bookings")}>
            <ArrowLeft className="w-4 h-4"/>
          </Button>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Book Lab Test
          </h1>
        </div>
        <p className="text-muted-foreground text-sm ml-11">
          Complete the steps below to book your diagnostic test
        </p>
        <div className="mt-6">
          <Stepper current={step}/>
        </div>
      </div>

      {error ? (<div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
          {error}
        </div>) : null}

      <div className="grid md:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="md:col-span-3">

          {/* Step 1 — Select Test */}
          {step === 1 && (<Card>
              <CardContent className="p-6">
                <h2 className="font-display font-semibold text-foreground mb-4">
                  Select Diagnostic Test
                </h2>
                <div className="space-y-3">
                  {tests.length === 0 ? (<p className="text-muted-foreground text-sm">
                      No diagnostic tests available.
                    </p>) : (tests.map((t) => {
                    const priceLabel = formatPrice(t);
                    return (
                        <label key={t._id} className={`flex items-center justify-between p-3.5 border rounded-lg cursor-pointer transition-colors ${selectedTest === t._id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40 hover:bg-muted/50 hover:shadow"}`}>
                          <div className="flex items-start gap-3">
                            <input type="radio" name="test" checked={selectedTest === t._id} onChange={() => setSelectedTest(t._id)} className="mr-2 mt-1 accent-primary w-4 h-4"/>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <FlaskConical className="w-4 h-4 text-primary/90"/>
                                <div className="font-medium text-foreground text-sm">
                                  {t.name}
                                </div>
                              </div>
                              {t.description && (<div className="text-xs text-muted-foreground">
                                  {t.description}
                                </div>)}
                              {t.instructions && (<div className="text-xs text-primary/70 italic">
                                  <span className="font-semibold not-italic">Prep: </span>
                                  {t.instructions}
                                </div>)}
                            </div>
                          </div>
                          {priceLabel ? (<div className="ml-4 text-sm font-medium text-primary bg-muted/10 px-2 py-0.5 rounded-md">
                            <span className="sr-only">Price</span>
                            {priceLabel}
                          </div>) : null}
                        </label>
                    );
                  })) }
                </div>
                <div className="flex justify-end mt-5">
                  <Button disabled={!selectedTest} onClick={() => setStep(2)}>
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>)}

          {/* Step 2 — Select Lab Center */}
          {step === 2 && (<Card>
              <CardContent className="p-6">
                <h2 className="font-display font-semibold text-foreground mb-4">
                  Select Lab Center
                </h2>
                <div className="space-y-3">
                  {centers.length === 0 ? (<p className="text-muted-foreground text-sm">
                      No lab centers available.
                    </p>) : (centers.map((c) => (<label key={c._id} className={`flex items-start p-3.5 border rounded-lg cursor-pointer transition-colors ${selectedCenter === c._id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"}`}>
                        <input type="radio" name="center" checked={selectedCenter === c._id} onChange={() => setSelectedCenter(c._id)} className="mr-3 mt-1 accent-primary"/>
                        <div>
                          <div className="font-medium text-foreground text-sm">
                            {c.name}
                          </div>
                          {(c.address || c.district) && (<div className="text-xs text-muted-foreground mt-0.5">
                              {[c.address, c.district].filter(Boolean).join(", ")}
                            </div>)}
                        </div>
                      </label>)))}
                </div>
                <div className="flex justify-between mt-5">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button disabled={!selectedCenter} onClick={() => setStep(3)}>
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>)}

          {/* Step 3 — Choose Slot */}
          {step === 3 && (<Card>
              <CardContent className="p-6">
                <h2 className="font-display font-semibold text-foreground mb-4">
                  Choose Date &amp; Time Slot
                </h2>
                <div className="grid md:grid-cols-2 gap-5 items-start">
                  <div className="self-start">
                    <MiniCalendar slots={slots.filter((s) => s.center === selectedCenter)} onSelectDate={(d) => {
                setSelectedDate(d);
                setSelectedSlot(null);
            }}/>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-medium text-sm text-foreground mb-3">
                      {selectedDate
                ? `Slots on ${selectedDate.toDateString()}`
                : "Select a highlighted date"}
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {availableForDate.length === 0 ? (<p className="text-sm text-muted-foreground">
                          {selectedDate
                    ? "No available slots for this date."
                    : "Pick a date with a dot to see available slots."}
                        </p>) : (availableForDate.map((s) => (<div key={s._id} className={`p-3 border rounded-lg flex justify-between items-center transition-colors ${selectedSlot === s._id
                    ? "ring-2 ring-primary/40 bg-primary/5 border-primary/30"
                    : "border-border hover:border-primary/40"}`}>
                            <div>
                              <div className="font-medium text-sm text-foreground">
                                {s.startTime} — {s.endTime}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Available
                              </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setSelectedSlot(s._id)}>
                              Select
                            </Button>
                          </div>)))}
                    </div>
                    <div className="flex justify-between mt-5">
                      <Button variant="outline" onClick={() => setStep(2)}>
                        Back
                      </Button>
                      <Button disabled={!selectedSlot} onClick={() => setStep(4)}>
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>)}

          {/* Step 4 — Confirm */}
          {step === 4 && (<div className="max-w-2xl mx-auto w-full transition-all duration-700">
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
                    <dt className="text-muted-foreground">Price</dt>
                    <dd className="mt-0.5">
                      {formatPrice(selectedTestObj) ? (<span className="inline-block text-sm font-medium text-primary bg-muted/10 px-2 py-0.5 rounded-md">{formatPrice(selectedTestObj)}</span>) : (<span className="font-medium text-foreground">—</span>)}
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
          </div>)}
        </div>

        {/* Summary Sidebar */}
        {/* Summary Sidebar */}
{step !== 4 && (
  <aside className="md:col-span-1">
    <div className="sticky top-6">
      <Card className="border-none ring-1 ring-border shadow-lg bg-card overflow-hidden">
        
        {/* Progress Header */}
        <div className="bg-primary/5 px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            
            {/* Progress Circle */}
            <div className="relative w-8 h-8 flex items-center justify-center rounded-full bg-background">
              <Heart 
                className={`w-4 h-4 transition-all duration-500 ${
                  selectedTest 
                    ? 'fill-primary text-primary scale-110 drop-shadow-[0_0_6px_rgba(99,102,241,0.4)]' 
                    : 'text-muted-foreground'
                }`} 
              />

              <svg className="absolute inset-0 w-full h-full -rotate-90">
                {/* Background ring */}
                <circle
                  cx="16"
                  cy="16"
                  r="13.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-primary/20"
                />
                
                {/* Progress ring */}
                <circle
                  cx="16"
                  cy="16"
                  r="13.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray={85}
                  strokeDashoffset={85 - (85 * summaryPercent) / 100}
                  className="text-primary transition-all duration-700 ease-in-out"
                />
              </svg>
            </div>

            <h3 className="font-semibold text-sm">Booking Summary</h3>
          </div>

          {step > 1 && (
            <button 
              onClick={() => setStep(Math.max(1, step - 1))} 
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        <CardContent className="p-4">
          <div className="space-y-4">
            
            {/* Summary items */}
            <div className="divide-y divide-border/50">
              <SummaryItem 
                label="Diagnostic Test" 
                value={selectedTestObj?.name} 
                icon={FlaskConical} 
                active={!!selectedTest} 
              />
              <SummaryItem 
                label="Lab Center" 
                value={selectedCenterObj?.name} 
                icon={MapPin} 
                active={!!selectedCenter} 
              />
              <SummaryItem 
                label="Appt. Date" 
                value={
                  selectedDate 
                    ? selectedDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      }) 
                    : null
                } 
                icon={Calendar} 
                active={!!selectedDate} 
              />
              <SummaryItem 
                label="Time Slot" 
                value={
                  selectedSlotObj 
                    ? `${selectedSlotObj.startTime} - ${selectedSlotObj.endTime}` 
                    : null
                } 
                icon={Clock} 
                active={!!selectedSlot} 
              />
            </div>

            {/* Price Footer */}
            <div className="pt-4 mt-2 border-t-2 border-dashed border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Payable
                </span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(selectedTestObj) || '—'}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-right italic">
                *Taxes may apply at the center
              </p>
            </div>

          </div>
        </CardContent>
      </Card>
      
      {/* Help Tip */}
      <div className="mt-4 px-2">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Need help? Contact our support if you face issues with slot availability.
        </p>
      </div>
    </div>
  </aside>
)}
      </div>
    </div>);
};
export default BookLabTestPage;
