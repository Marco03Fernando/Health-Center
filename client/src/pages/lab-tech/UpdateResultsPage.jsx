import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getAllLabBookings,
  getTestTypes,
  createTestResult,
  updateBookingStatus,
  getTestResults,
  updateTestResult,
  openTestResultPdf,
  sendTestResultWhatsApp,
  sendTestResultEmail,
} from "@/services/lab-tech.service";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  ClipboardEdit,
  Search,
  Loader2,
  AlertCircle,
  FlaskConical,
  ClipboardList,
  Calendar,
  User,
  CheckCircle2,
  Clock3,
} from "lucide-react";

const TABS = [
  { label: "Pending Results", value: "pending" },
  { label: "Completed Results", value: "completed" },
];

const STATUS_STYLES = {
  RESULT_PENDING: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
};

function formatDate(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TestResultsPage() {
  const [searchParams] = useSearchParams();
  const bookingIdFromUrl = searchParams.get("bookingId");

  const [activeTab, setActiveTab] = useState("pending");
  const [bookings, setBookings] = useState([]);
  const [testTypes, setTestTypes] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sendingNotificationId, setSendingNotificationId] = useState("");

  // add result dialog/form states
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTestTypeId, setSelectedTestTypeId] = useState("");
  const [resultParams, setResultParams] = useState([]);
  const [condition, setCondition] = useState("unknown");
  const [notes, setNotes] = useState("");
  const [recommendConsultation, setRecommendConsultation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // view dialog
  const [viewingResult, setViewingResult] = useState(null);

  // edit dialog
  const [editingResult, setEditingResult] = useState(null);
  const [editResultParams, setEditResultParams] = useState([]);
  const [editCondition, setEditCondition] = useState("unknown");
  const [editNotes, setEditNotes] = useState("");
  const [editRecommendConsultation, setEditRecommendConsultation] = useState(false);
  const [editingSubmit, setEditingSubmit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  async function fetchAll() {
    try {
      setLoading(true);
      setError("");

      const [bookingsRes, testTypesRes, testResultsRes] = await Promise.all([
        getAllLabBookings(),
        getTestTypes(),
        getTestResults(),
      ]);

      setBookings(Array.isArray(bookingsRes) ? bookingsRes : []);
      setTestTypes(Array.isArray(testTypesRes) ? testTypesRes : []);
      setTestResults(Array.isArray(testResultsRes) ? testResultsRes : []);
    } catch (err) {
      setError(err?.message || "Failed to load test result data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  const pendingResults = useMemo(() => {
    return bookings.filter((b) => b?.appointmentStatus === "RESULT_PENDING");
  }, [bookings]);

  const completedResults = useMemo(() => {
    return testResults;
  }, [testResults]);

  const filteredPendingResults = useMemo(() => {
    const q = search.trim().toLowerCase();

    return pendingResults.filter((b) => {
      if (!q) return true;

      const patientName = (b?.user?.fullName || b?.user?.name || "").toLowerCase();
      const testName = (b?.diagnosticTest?.name || "").toLowerCase();
      const appointmentId = (b?._id || "").toLowerCase();

      return (
        patientName.includes(q) ||
        testName.includes(q) ||
        appointmentId.includes(q)
      );
    });
  }, [pendingResults, search]);

  const filteredCompletedResults = useMemo(() => {
    const q = search.trim().toLowerCase();

    return completedResults.filter((r) => {
      if (!q) return true;

      const patientName = (
        r?.appointmentId?.user?.fullName ||
        r?.appointmentId?.user?.name ||
        ""
      ).toLowerCase();

      const testName = (r?.testTypeId?.name || "").toLowerCase();
      const appointmentId = (r?.appointmentId?._id || "").toLowerCase();

      return (
        patientName.includes(q) ||
        testName.includes(q) ||
        appointmentId.includes(q)
      );
    });
  }, [completedResults, search]);

  function openResultDialog(booking) {
    setSelectedBooking(booking);
    setSubmitError("");
    setSubmitSuccess(false);
    setCondition("unknown");
    setNotes("");
    setRecommendConsultation(false);

    const matchedType = testTypes.find(
      (t) =>
        t?.name?.trim().toLowerCase() ===
        (booking?.diagnosticTest?.name || "").trim().toLowerCase()
    );

    if (matchedType) {
      setSelectedTestTypeId(matchedType._id);
      setResultParams(
        (matchedType.parameters || []).map((p) => ({
          name: p.name || "",
          value: "",
          unit: p.unit || "",
          normalMinValue: p.normalMinValue,
          normalMaxValue: p.normalMaxValue,
        }))
      );
    } else {
      setSelectedTestTypeId("");
      setResultParams([]);
    }
  }

  function closeResultDialog() {
    setSelectedBooking(null);
    setSelectedTestTypeId("");
    setResultParams([]);
    setCondition("unknown");
    setNotes("");
    setRecommendConsultation(false);
    setSubmitError("");
    setSubmitSuccess(false);
  }

  function handleTestTypeChange(typeId) {
    setSelectedTestTypeId(typeId);

    const selectedType = testTypes.find((t) => t._id === typeId);

    if (selectedType?.parameters?.length) {
      setResultParams(
        selectedType.parameters.map((p) => ({
          name: p.name || "",
          value: "",
          unit: p.unit || "",
          normalMinValue: p.normalMinValue,
          normalMaxValue: p.normalMaxValue,
        }))
      );
    } else {
      setResultParams([]);
    }
  }

  function updateParam(index, field, value) {
    setResultParams((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addManualParam() {
    setResultParams((prev) => [
      ...prev,
      {
        name: "",
        value: "",
        unit: "",
        normalMinValue: undefined,
        normalMaxValue: undefined,
      },
    ]);
  }

  function removeParam(index) {
    setResultParams((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmitResult(e) {
    e.preventDefault();

    if (!selectedBooking) return;

    if (!selectedTestTypeId) {
      setSubmitError("Please select a test type.");
      return;
    }

    if (resultParams.length === 0) {
      setSubmitError("Please add at least one result parameter.");
      return;
    }

    const hasInvalidRow = resultParams.some(
      (p) =>
        !String(p.name || "").trim() ||
        String(p.value || "").trim() === "" ||
        !String(p.unit || "").trim()
    );

    if (hasInvalidRow) {
      setSubmitError("Please fill all parameter fields.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      const payload = {
        appointmentId: selectedBooking._id,
        testTypeId: selectedTestTypeId,
        patientId: selectedBooking?.user?._id,
        status: "completed",
        condition,
        results: resultParams.map((p) => ({
          name: String(p.name).trim(),
          value: Number(p.value),
          unit: String(p.unit).trim(),
          normalMinValue: p.normalMinValue,
          normalMaxValue: p.normalMaxValue,
        })),
        notes: notes?.trim() || undefined,
        recommendConsultation,
      };

      await createTestResult(payload);
      await updateBookingStatus(selectedBooking._id, "COMPLETED");
      await fetchAll();

      setSubmitSuccess(true);

      setTimeout(() => {
        closeResultDialog();
        setActiveTab("completed");
      }, 1200);
    } catch (err) {
      setSubmitError(err?.message || "Failed to create test result.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendNotification(resultId) {
    try {
      setSendingNotificationId(resultId);

      const results = await Promise.allSettled([
        sendTestResultWhatsApp(resultId),
        sendTestResultEmail(resultId),
      ]);

      const whatsappOk = results[0].status === "fulfilled";
      const emailOk = results[1].status === "fulfilled";

      if (whatsappOk && emailOk) {
        alert("WhatsApp and email sent successfully.");
        return;
      }

      if (whatsappOk && !emailOk) {
        const emailError =
          results[1]?.reason?.message || "Email failed to send.";
        alert(`WhatsApp sent successfully, but email failed.\n${emailError}`);
        return;
      }

      if (!whatsappOk && emailOk) {
        const whatsappError =
          results[0]?.reason?.message || "WhatsApp failed to send.";
        alert(`Email sent successfully, but WhatsApp failed.\n${whatsappError}`);
        return;
      }

      const whatsappError =
        results[0]?.reason?.message || "WhatsApp failed to send.";
      const emailError =
        results[1]?.reason?.message || "Email failed to send.";

      alert(
        `Both notifications failed.\nWhatsApp: ${whatsappError}\nEmail: ${emailError}`
      );
    } finally {
      setSendingNotificationId("");
    }
  }

  function openViewDialog(result) {
    setViewingResult(result);
  }

  function closeViewDialog() {
    setViewingResult(null);
  }

  function openEditDialog(result) {
    setEditingResult(result);
    setEditError("");
    setEditSuccess(false);
    setEditCondition(result?.condition || "unknown");
    setEditNotes(result?.notes || "");
    setEditRecommendConsultation(!!result?.recommendConsultation);
    setEditResultParams(
      (result?.results || []).map((p) => ({
        name: p.name || "",
        value: p.value ?? "",
        unit: p.unit || "",
        normalMinValue: p.normalMinValue,
        normalMaxValue: p.normalMaxValue,
      }))
    );
  }

  function closeEditDialog() {
    setEditingResult(null);
    setEditResultParams([]);
    setEditCondition("unknown");
    setEditNotes("");
    setEditRecommendConsultation(false);
    setEditError("");
    setEditSuccess(false);
  }

  function updateEditParam(index, field, value) {
    setEditResultParams((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  async function handleEditSubmit(e) {
    e.preventDefault();

    if (!editingResult) return;

    const hasInvalidRow = editResultParams.some(
      (p) =>
        !String(p.name || "").trim() ||
        String(p.value || "").trim() === "" ||
        !String(p.unit || "").trim()
    );

    if (hasInvalidRow) {
      setEditError("Please fill all parameter fields.");
      return;
    }

    try {
      setEditingSubmit(true);
      setEditError("");

      const payload = {
        condition: editCondition,
        results: editResultParams.map((p) => ({
          name: String(p.name).trim(),
          value: Number(p.value),
          unit: String(p.unit).trim(),
          normalMinValue: p.normalMinValue,
          normalMaxValue: p.normalMaxValue,
        })),
        notes: editNotes?.trim() || "",
        recommendConsultation: editRecommendConsultation,
        status: editingResult?.status || "completed",
      };

      await updateTestResult(editingResult._id, payload);
      await fetchAll();

      setEditSuccess(true);

      setTimeout(() => {
        closeEditDialog();
      }, 1200);
    } catch (err) {
      setEditError(err?.message || "Failed to update test result.");
    } finally {
      setEditingSubmit(false);
    }
  }

  useEffect(() => {
    if (!bookingIdFromUrl || loading) return;

    const matched = pendingResults.find((b) => b._id === bookingIdFromUrl);
    if (matched) {
      openResultDialog(matched);
    }
  }, [bookingIdFromUrl, loading, pendingResults, testTypes]);

  const selectedTestType = useMemo(() => {
    return testTypes.find((t) => t._id === selectedTestTypeId) || null;
  }, [testTypes, selectedTestTypeId]);

  return (
    <div className="space-y-8 p-2">
      {/* HEADER */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ClipboardEdit className="h-4 w-4" />
          Lab Test Result Management
        </div>

        <h1 className="mt-2 text-3xl font-bold">Test Results</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Manage pending result entries and review completed lab results.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pending Results</p>
              <p className="text-xl font-bold">{pendingResults.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Completed Results</p>
              <p className="text-xl font-bold">{completedResults.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Available Test Types</p>
              <p className="text-xl font-bold">{testTypes.length}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* SEARCH + TABS */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by patient, test, or appointment ID..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <Button
                  key={tab.value}
                  variant={activeTab === tab.value ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.value)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading test result data...
        </div>
      ) : (
        <>
          {/* PENDING TAB */}
          {activeTab === "pending" && (
            <Card>
              <CardContent className="p-5 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold">Pending Results</h2>
                  <p className="text-sm text-muted-foreground">
                    These appointments are waiting for result entry.
                  </p>
                </div>

                {filteredPendingResults.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-10 text-center">
                    <ClipboardList className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">No pending result appointments found</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      When a booking becomes RESULT_PENDING, it will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPendingResults.map((b) => (
                      <Card key={b._id} className="border shadow-none transition hover:shadow-sm">
                        <CardContent className="p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0 space-y-2">
                              <h3 className="text-lg font-bold">
                                {b?.user?.fullName || b?.user?.name || "Patient"}
                              </h3>

                              <p className="text-sm font-medium text-muted-foreground">
                                {b?.diagnosticTest?.name || "Diagnostic Test"}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <p>Appointment ID: {b?._id || "—"}</p>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDate(b?.slot?.slotDate || b?.appointmentDate)}
                                </span>
                                <Badge className={STATUS_STYLES.RESULT_PENDING}>
                                  RESULT_PENDING
                                </Badge>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button onClick={() => openResultDialog(b)}>
                                <ClipboardEdit className="mr-2 h-4 w-4" />
                                Add Result
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
          )}

          {/* COMPLETED TAB */}
          {activeTab === "completed" && (
            <Card>
              <CardContent className="p-5 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold">Completed Results</h2>
                  <p className="text-sm text-muted-foreground">
                    View and edit saved test results.
                  </p>
                </div>

                {filteredCompletedResults.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-10 text-center">
                    <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">No completed results found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCompletedResults.map((r) => (
                      <Card key={r._id} className="border shadow-none transition hover:shadow-sm">
                        <CardContent className="p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0 space-y-2">
                              <h3 className="text-lg font-bold">
                                {r?.appointmentId?.user?.fullName ||
                                  r?.appointmentId?.user?.name ||
                                  "Patient"}
                              </h3>

                              <p className="text-sm font-medium text-muted-foreground">
                                {r?.testTypeId?.name || "Test Type"}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <p>Appointment ID: {r?.appointmentId?._id || "—"}</p>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDate(
                                    r?.appointmentId?.slot?.slotDate ||
                                    r?.appointmentId?.appointmentDate
                                  )}
                                </span>
                                <Badge className={STATUS_STYLES.COMPLETED}>
                                  COMPLETED
                                </Badge>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                onClick={() => openViewDialog(r)}
                              >
                                View
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => openEditDialog(r)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => openTestResultPdf(r._id)}
                              >
                                Open PDF
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleSendNotification(r._id)}
                                disabled={sendingNotificationId === r._id}
                              >
                                {sendingNotificationId === r._id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  "Send Notification"
                                )}
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
          )}
        </>
      )}

      {/* ADD RESULT DIALOG */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && closeResultDialog()}>
        <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="border-b bg-background px-6 py-4">
            <DialogTitle className="text-xl">Add Test Result</DialogTitle>
            <DialogDescription>
              {selectedBooking?.diagnosticTest?.name || "Diagnostic Test"} —{" "}
              {selectedBooking?.user?.fullName || selectedBooking?.user?.name || "Patient"}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <form onSubmit={handleSubmitResult} className="max-h-[80vh] overflow-y-auto px-6 pb-6">
              <div className="space-y-6 py-4">
                {submitError && (
                  <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {submitError}
                  </div>
                )}

                {submitSuccess && (
                  <div className="flex items-center gap-2 rounded-2xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Test result created successfully.
                  </div>
                )}

                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="mb-3 text-sm font-semibold">Appointment Summary</p>
                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Patient</p>
                      <p className="font-medium">
                        {selectedBooking?.user?.fullName || selectedBooking?.user?.name || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Test</p>
                      <p className="font-medium">
                        {selectedBooking?.diagnosticTest?.name || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Appointment Date</p>
                      <p className="font-medium">
                        {formatDate(selectedBooking?.slot?.slotDate || selectedBooking?.appointmentDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Appointment ID</p>
                      <p className="font-medium">{selectedBooking?._id || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Test Type <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedTestTypeId} onValueChange={handleTestTypeChange}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      {testTypes.map((type) => (
                        <SelectItem key={type._id} value={type._id}>
                          {type.name} — {type.testCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Result Parameters</Label>

                    {!selectedTestType?.parameters?.length && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addManualParam}
                      >
                        Add Parameter
                      </Button>
                    )}
                  </div>

                  {resultParams.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                      No parameters loaded. Select a test type, or add parameters manually.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {resultParams.map((param, index) => (
                        <div key={index} className="rounded-2xl border bg-muted/20 p-4">
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Parameter Name</Label>
                              <Input
                                value={param.name}
                                readOnly={!!selectedTestType?.parameters?.length}
                                onChange={(e) => updateParam(index, "name", e.target.value)}
                                placeholder="e.g. Hemoglobin"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs">
                                Value
                                {param.normalMinValue !== undefined &&
                                  param.normalMaxValue !== undefined
                                  ? ` (Normal: ${param.normalMinValue} - ${param.normalMaxValue})`
                                  : ""}
                              </Label>
                              <Input
                                type="number"
                                step="any"
                                value={param.value}
                                onChange={(e) => updateParam(index, "value", e.target.value)}
                                placeholder="Enter result value"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs">Unit</Label>
                              <div className="flex gap-2">
                                <Input
                                  value={param.unit}
                                  readOnly={!!selectedTestType?.parameters?.length}
                                  onChange={(e) => updateParam(index, "unit", e.target.value)}
                                  placeholder="e.g. mg/dL"
                                />
                                {!selectedTestType?.parameters?.length && resultParams.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="text-destructive"
                                    onClick={() => removeParam(index)}
                                  >
                                    ✕
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Overall Condition</Label>
                  <Select value={condition} onValueChange={setCondition}>
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

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional observations..."
                    className="resize-none rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border bg-muted/20 p-4">
                  <div>
                    <p className="text-sm font-medium">Recommend Consultation</p>
                    <p className="text-xs text-muted-foreground">
                      Mark this result for doctor follow-up
                    </p>
                  </div>
                  <Switch
                    checked={recommendConsultation}
                    onCheckedChange={setRecommendConsultation}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeResultDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting || submitSuccess}>
                    {submitting ? "Creating..." : "Create Result"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* VIEW RESULT DIALOG */}
      <Dialog open={!!viewingResult} onOpenChange={(open) => !open && closeViewDialog()}>
        <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="border-b bg-background px-6 py-4">
            <DialogTitle className="text-xl">View Test Result</DialogTitle>
            <DialogDescription>
              {viewingResult?.testTypeId?.name || "Test Result"} —{" "}
              {viewingResult?.appointmentId?.user?.fullName ||
                viewingResult?.appointmentId?.user?.name ||
                "Patient"}
            </DialogDescription>
          </DialogHeader>

          {viewingResult && (
            <div className="max-h-[80vh] overflow-y-auto px-6 pb-6">
              <div className="space-y-6 py-4">
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="mb-3 text-sm font-semibold">Appointment Details</p>
                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Patient</p>
                      <p className="font-medium">
                        {viewingResult?.appointmentId?.user?.fullName ||
                          viewingResult?.appointmentId?.user?.name ||
                          "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Test Type</p>
                      <p className="font-medium">
                        {viewingResult?.testTypeId?.name || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Appointment ID</p>
                      <p className="font-medium">
                        {viewingResult?.appointmentId?._id || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Appointment Date</p>
                      <p className="font-medium">
                        {formatDate(
                          viewingResult?.appointmentId?.slot?.slotDate ||
                          viewingResult?.appointmentId?.appointmentDate
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="mb-3 text-sm font-semibold">Result Details</p>
                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Condition</p>
                      <p className="font-medium">{viewingResult?.condition || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Recommend Consultation</p>
                      <p className="font-medium">
                        {viewingResult?.recommendConsultation ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-medium">Parameters</p>
                    {(viewingResult?.results || []).map((param, index) => (
                      <div key={index} className="rounded-xl border p-3 text-sm">
                        <div className="grid gap-2 sm:grid-cols-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Name</p>
                            <p className="font-medium">{param?.name || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Value</p>
                            <p className="font-medium">{param?.value ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Unit</p>
                            <p className="font-medium">{param?.unit || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Normal Range</p>
                            <p className="font-medium">
                              {param?.normalMinValue !== undefined &&
                                param?.normalMaxValue !== undefined
                                ? `${param.normalMinValue} - ${param.normalMaxValue}`
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="font-medium text-sm">
                      {viewingResult?.notes || "—"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="mb-3 text-sm font-semibold">Timestamps</p>
                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Created Time</p>
                      <p className="font-medium">
                        {formatDateTime(viewingResult?.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Updated Time</p>
                      <p className="font-medium">
                        {formatDateTime(viewingResult?.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={closeViewDialog}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT RESULT DIALOG */}
      <Dialog open={!!editingResult} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="border-b bg-background px-6 py-4">
            <DialogTitle className="text-xl">Edit Test Result</DialogTitle>
            <DialogDescription>
              {editingResult?.testTypeId?.name || "Test Result"} —{" "}
              {editingResult?.appointmentId?.user?.fullName ||
                editingResult?.appointmentId?.user?.name ||
                "Patient"}
            </DialogDescription>
          </DialogHeader>

          {editingResult && (
            <form onSubmit={handleEditSubmit} className="max-h-[80vh] overflow-y-auto px-6 pb-6">
              <div className="space-y-6 py-4">
                {editError && (
                  <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {editError}
                  </div>
                )}

                {editSuccess && (
                  <div className="flex items-center gap-2 rounded-2xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Test result updated successfully.
                  </div>
                )}

                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="mb-3 text-sm font-semibold">Appointment Details</p>
                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Patient</p>
                      <Input
                        value={
                          editingResult?.appointmentId?.user?.fullName ||
                          editingResult?.appointmentId?.user?.name ||
                          "—"
                        }
                        readOnly
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Test Type</p>
                      <Input
                        value={editingResult?.testTypeId?.name || "—"}
                        readOnly
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Appointment ID</p>
                      <Input
                        value={editingResult?.appointmentId?._id || "—"}
                        readOnly
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Appointment Date</p>
                      <Input
                        value={formatDate(
                          editingResult?.appointmentId?.slot?.slotDate ||
                          editingResult?.appointmentId?.appointmentDate
                        )}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Result Parameters</Label>
                  <div className="space-y-3">
                    {editResultParams.map((param, index) => (
                      <div key={index} className="rounded-2xl border bg-muted/20 p-4">
                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Parameter Name</Label>
                            <Input
                              value={param.name}
                              onChange={(e) =>
                                updateEditParam(index, "name", e.target.value)
                              }
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              Value
                              {param.normalMinValue !== undefined &&
                                param.normalMaxValue !== undefined
                                ? ` (Normal: ${param.normalMinValue} - ${param.normalMaxValue})`
                                : ""}
                            </Label>
                            <Input
                              type="number"
                              step="any"
                              value={param.value}
                              onChange={(e) =>
                                updateEditParam(index, "value", e.target.value)
                              }
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs">Unit</Label>
                            <Input
                              value={param.unit}
                              onChange={(e) =>
                                updateEditParam(index, "unit", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Overall Condition</Label>
                  <Select value={editCondition} onValueChange={setEditCondition}>
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

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="resize-none rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border bg-muted/20 p-4">
                  <div>
                    <p className="text-sm font-medium">Recommend Consultation</p>
                    <p className="text-xs text-muted-foreground">
                      Mark this result for doctor follow-up
                    </p>
                  </div>
                  <Switch
                    checked={editRecommendConsultation}
                    onCheckedChange={setEditRecommendConsultation}
                  />
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="mb-3 text-sm font-semibold">Timestamps</p>
                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Created Time</p>
                      <Input
                        value={formatDateTime(editingResult?.createdAt)}
                        readOnly
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Updated Time</p>
                      <Input
                        value={formatDateTime(editingResult?.updatedAt)}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeEditDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editingSubmit || editSuccess}>
                    {editingSubmit ? "Updating..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}