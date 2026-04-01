import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLabTech } from "@/contexts/LabTechContext";
import { getLabBookings, getTestTypes, createTestResult, updateBookingStatus, } from "@/services/lab-tech.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from "@/components/ui/dialog";
import { ClipboardEdit, Search, Loader2, AlertCircle, CheckCircle2, Calendar, User, FlaskConical, ClipboardList, } from "lucide-react";
function formatDate(raw) {
    if (!raw)
        return "—";
    return new Date(raw).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}
export default function UpdateResultsPage() {
    const { centerId } = useLabTech();
    const [searchParams] = useSearchParams();
    const preselectedBookingId = searchParams.get("bookingId");
    const [bookings, setBookings] = useState([]);
    const [testTypes, setTestTypes] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [dataError, setDataError] = useState("");
    const [bookingSearch, setBookingSearch] = useState("");
    // Form dialog state
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedTestTypeId, setSelectedTestTypeId] = useState("");
    const [resultParams, setResultParams] = useState([]);
    const [notes, setNotes] = useState("");
    const [condition, setCondition] = useState("unknown");
    const [recommendConsultation, setRecommendConsultation] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);
    useEffect(() => {
        loadAll();
    }, [centerId]);
    async function loadAll() {
        try {
            setLoadingData(true);
            setDataError("");
            const [bookingsRes, typesRes] = await Promise.allSettled([
                centerId
                    ? getLabBookings(centerId)
                    : Promise.resolve([]),
                getTestTypes(centerId || undefined),
            ]);
            if (bookingsRes.status === "fulfilled") {
                const confirmed = bookingsRes.value.filter((b) => b.appointmentStatus === "CONFIRMED");
                setBookings(confirmed);
                if (preselectedBookingId) {
                    const pre = confirmed.find((b) => b._id === preselectedBookingId);
                    if (pre)
                        openResultForm(pre);
                }
            }
            if (typesRes.status === "fulfilled")
                setTestTypes(typesRes.value);
        }
        catch (err) {
            setDataError(err?.message || "Failed to load data.");
        }
        finally {
            setLoadingData(false);
        }
    }
    function openResultForm(booking) {
        setSelectedBooking(booking);
        setSelectedTestTypeId("");
        setResultParams([]);
        setNotes("");
        setCondition("unknown");
        setRecommendConsultation(false);
        setSubmitError("");
        setSubmitSuccess(false);
    }
    function closeResultForm() {
        setSelectedBooking(null);
        setSubmitError("");
        setSubmitSuccess(false);
    }
    function handleTestTypeChange(typeId) {
        setSelectedTestTypeId(typeId);
        const testType = testTypes.find((t) => t._id === typeId);
        if (testType?.parameters?.length) {
            setResultParams(testType.parameters.map((p) => ({
                name: p.name,
                value: "",
                unit: p.unit,
                normalMinValue: p.normalMinValue,
                normalMaxValue: p.normalMaxValue,
            })));
        }
        else {
            // Allow manual entry of a single result row if no defined parameters
            setResultParams([{ name: "", value: "", unit: "" }]);
        }
    }
    function addManualParam() {
        setResultParams((prev) => [...prev, { name: "", value: "", unit: "" }]);
    }
    function removeParam(index) {
        setResultParams((prev) => prev.filter((_, i) => i !== index));
    }
    function updateParam(index, field, value) {
        setResultParams((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
    }
    async function handleSubmit(e) {
        e.preventDefault();
        if (!selectedBooking)
            return;
        if (!selectedTestTypeId) {
            setSubmitError("Please select a test type.");
            return;
        }
        if (resultParams.length === 0) {
            setSubmitError("Please add at least one result parameter.");
            return;
        }
        const incomplete = resultParams.some((p) => !p.name.trim() || p.value === "" || !p.unit.trim());
        if (incomplete) {
            setSubmitError("Please fill in all parameter fields (name, value, unit).");
            return;
        }
        try {
            setSubmitting(true);
            setSubmitError("");
            await createTestResult({
                appointmentId: selectedBooking._id,
                testTypeId: selectedTestTypeId,
                patientId: selectedBooking.user?._id || undefined,
                status: "completed",
                condition,
                results: resultParams.map((p) => ({
                    name: p.name.trim(),
                    value: parseFloat(p.value),
                    unit: p.unit.trim(),
                    normalMinValue: p.normalMinValue,
                    normalMaxValue: p.normalMaxValue,
                })),
                notes: notes.trim() || undefined,
                recommendConsultation,
            });
            await updateBookingStatus(selectedBooking._id, "COMPLETED");
            setSubmitSuccess(true);
            setBookings((prev) => prev.filter((b) => b._id !== selectedBooking._id));
            setTimeout(closeResultForm, 1500);
        }
        catch (err) {
            setSubmitError(err?.message || "Failed to submit results.");
        }
        finally {
            setSubmitting(false);
        }
    }
    const filteredBookings = useMemo(() => {
        const q = bookingSearch.toLowerCase();
        if (!q)
            return bookings;
        return bookings.filter((b) => (b.diagnosticTest?.name || "").toLowerCase().includes(q) ||
            (b.user?.fullName || b.user?.name || "")
                .toLowerCase()
                .includes(q));
    }, [bookings, bookingSearch]);
    const selectedTestType = useMemo(() => testTypes.find((t) => t._id === selectedTestTypeId), [testTypes, selectedTestTypeId]);
    return (<div className="space-y-8 p-1 md:p-2">
      {/* Header */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            <ClipboardEdit className="h-3.5 w-3.5"/>
            Result Entry
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Update Results
            </h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Enter test results for confirmed lab bookings.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            { label: "Pending Results", value: bookings.length, color: "text-amber-600" },
            { label: "Test Type Definitions", value: testTypes.length, color: "text-primary" },
        ].map(({ label, value, color }) => (<Card key={label} className="rounded-2xl border shadow-none">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`mt-2 text-2xl font-bold ${color}`}>
                  {loadingData ? "--" : value}
                </p>
              </CardContent>
            </Card>))}
        </div>
      </div>

      {dataError && (<div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0"/>
          {dataError}
        </div>)}

      {/* Bookings list */}
      <Card className="rounded-3xl border shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Confirmed Bookings</h2>
              <p className="text-sm text-muted-foreground">
                Select a booking to enter test results
              </p>
            </div>
            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
              <Input placeholder="Search by test or patient…" className="h-11 rounded-xl pl-10" value={bookingSearch} onChange={(e) => setBookingSearch(e.target.value)}/>
            </div>
          </div>

          {loadingData ? (<div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
              Loading confirmed bookings…
            </div>) : filteredBookings.length === 0 ? (<div className="rounded-2xl border border-dashed p-10 text-center">
              <ClipboardList className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/>
              <p className="text-sm font-medium">
                No confirmed bookings pending results
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                All results are up to date, or there are no upcoming bookings.
              </p>
            </div>) : (<div className="space-y-3">
              {filteredBookings.map((b) => (<Card key={b._id} className="rounded-2xl border shadow-none transition-all hover:shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10">
                          <FlaskConical className="h-5 w-5 text-amber-600"/>
                        </div>
                        <div className="min-w-0 space-y-1">
                          <h3 className="text-base font-semibold">
                            {b.diagnosticTest?.name || "Lab Test"}
                          </h3>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5"/>
                              {b.user?.fullName || b.user?.name || "—"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5"/>
                              {formatDate(b.slot?.slotDate || b.appointmentDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button className="shrink-0 rounded-xl" onClick={() => openResultForm(b)}>
                        <ClipboardEdit className="mr-2 h-4 w-4"/>
                        Enter Results
                      </Button>
                    </div>
                  </CardContent>
                </Card>))}
            </div>)}
        </CardContent>
      </Card>

      {/* Result Entry Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && closeResultForm()}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
            <DialogTitle className="text-xl">Enter Test Results</DialogTitle>
            <DialogDescription>
              {selectedBooking?.diagnosticTest?.name || "Lab Test"} —{" "}
              {selectedBooking?.user?.fullName ||
            selectedBooking?.user?.name ||
            "Patient"}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (<form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 pb-6">
              <div className="space-y-6 py-4">
                {submitError && (<div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0"/>
                    {submitError}
                  </div>)}
                {submitSuccess && (<div className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4 shrink-0"/>
                    Results submitted successfully!
                  </div>)}

                {/* Test Type Selection */}
                <div className="space-y-2">
                  <Label>
                    Test Type Definition{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedTestTypeId} onValueChange={handleTestTypeChange}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select test type for parameter fields…"/>
                    </SelectTrigger>
                    <SelectContent>
                      {testTypes.map((t) => (<SelectItem key={t._id} value={t._id}>
                          {t.name} — {t.testCode}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                  {testTypes.length === 0 && (<p className="text-xs text-muted-foreground">
                      No test type definitions found. Ask the administrator to
                      create test types in the system.
                    </p>)}
                </div>

                {/* Result Parameters */}
                {resultParams.length > 0 && (<div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Result Parameters</Label>
                      {!selectedTestType && (<Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={addManualParam}>
                          Add Parameter
                        </Button>)}
                    </div>
                    <div className="space-y-3">
                      {resultParams.map((param, idx) => (<div key={idx} className="rounded-2xl border bg-muted/20 p-4">
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Parameter Name</Label>
                              <Input value={param.name} placeholder="e.g. Hemoglobin" readOnly={!!selectedTestType} onChange={(e) => updateParam(idx, "name", e.target.value)} className="h-9 rounded-xl text-sm"/>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">
                                Value{" "}
                                {param.normalMinValue !== undefined &&
                        param.normalMaxValue !== undefined
                        ? `(Normal: ${param.normalMinValue}–${param.normalMaxValue})`
                        : ""}
                              </Label>
                              <Input type="number" step="any" value={param.value} placeholder="0.00" onChange={(e) => updateParam(idx, "value", e.target.value)} className="h-9 rounded-xl text-sm"/>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Unit</Label>
                              <div className="flex gap-2">
                                <Input value={param.unit} placeholder="e.g. g/dL" readOnly={!!selectedTestType} onChange={(e) => updateParam(idx, "unit", e.target.value)} className="h-9 rounded-xl text-sm"/>
                                {!selectedTestType && resultParams.length > 1 && (<Button type="button" variant="ghost" size="sm" className="h-9 px-2 text-destructive hover:text-destructive" onClick={() => removeParam(idx)}>
                                    ✕
                                  </Button>)}
                              </div>
                            </div>
                          </div>
                        </div>))}
                    </div>
                  </div>)}

                {/* Condition */}
                <div className="space-y-2">
                  <Label>Overall Condition</Label>
                  <Select value={condition} onValueChange={(v) => setCondition(v)}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="result-notes">Notes</Label>
                  <Textarea id="result-notes" placeholder="Any additional observations or notes…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="resize-none rounded-xl"/>
                </div>

                {/* Recommend Consultation */}
                <div className="flex items-center justify-between rounded-2xl border bg-muted/20 p-4">
                  <div>
                    <p className="text-sm font-medium">
                      Recommend Consultation
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Flag this result for doctor follow-up
                    </p>
                  </div>
                  <Switch checked={recommendConsultation} onCheckedChange={setRecommendConsultation}/>
                </div>

                {/* Booking summary */}
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="mb-3 text-sm font-semibold">Booking Summary</p>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    {[
                {
                    label: "Patient",
                    value: selectedBooking.user?.fullName ||
                        selectedBooking.user?.name ||
                        "—",
                },
                {
                    label: "Test",
                    value: selectedBooking.diagnosticTest?.name || "—",
                },
                {
                    label: "Date",
                    value: formatDate(selectedBooking.slot?.slotDate ||
                        selectedBooking.appointmentDate),
                },
                {
                    label: "Time",
                    value: selectedBooking.slot?.startTime &&
                        selectedBooking.slot?.endTime
                        ? `${selectedBooking.slot.startTime} — ${selectedBooking.slot.endTime}`
                        : selectedBooking.slot?.startTime || "—",
                },
            ].map(({ label, value }) => (<div key={label}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-medium">{value}</p>
                      </div>))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" className="rounded-xl" onClick={closeResultForm}>
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-xl" disabled={submitting || submitSuccess}>
                    {submitting ? "Submitting…" : "Submit Results"}
                  </Button>
                </div>
              </div>
            </form>)}
        </DialogContent>
      </Dialog>
    </div>);
}
