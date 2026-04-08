import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
import { openTestResultPdf } from "@/services/lab-tech.service";

const STATUS_MAP = {
  pending: "pending",
  undergoing: "processing",
  completed: "completed",
};

const TestReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReport() {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const res = await apiFetch(`/test-results/${id}`);
      const data = res?.data || res || null;
      setReport(data);
    } catch (err) {
      setError(err.message || "Failed to load report details");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, [id]);

  if (loading) {
    return (<div className="flex items-center justify-center py-20"><div className="text-muted-foreground">Loading report...</div></div>);
  }

  if (error || !report) {
    return (<div className="space-y-4 animate-fade-in"><button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground"> <ArrowLeft className="w-4 h-4"/> Back</button><div className="text-center py-12 text-muted-foreground">{error || "Report not found."}</div></div>);
  }

  const appt = report.appointmentId || {};
  const testName = appt.diagnosticTest?.name || report.testTypeId?.name || "Test";
  const labName = appt.healthCenter?.name || "—";
  const rawDate = appt.slot?.slotDate || report.createdAt;
  const date = rawDate ? new Date(rawDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
  const time = appt.slot?.startTime ? (appt.slot.endTime ? `${appt.slot.startTime} — ${appt.slot.endTime}` : appt.slot.startTime) : "—";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Test Reports
          </button>
          <h1 className="font-display text-xl font-bold text-foreground mt-3">{testName}</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="text-sm text-muted-foreground">{labName}</div>
            <div className="text-sm text-muted-foreground">·</div>
            <div className="text-sm text-muted-foreground">{date}{time ? ` · ${time}` : ""}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={STATUS_MAP[report.status] ?? "pending"} />
          <Button onClick={() => openTestResultPdf(id)} size="sm"><Download className="w-4 h-4 mr-2"/>Download</Button>
        </div>
      </div>

      <Separator />

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Result Values</h2>
          <div className="space-y-3">
            {Array.isArray(report.results) && report.results.length > 0 ? report.results.map((p, idx) => (
              <div key={idx} className="rounded-lg border p-3">
                <div className="flex justify-between items-baseline">
                  <div className="font-medium text-foreground">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{p.value} {p.unit}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Reference: {p.normalMinValue ?? "—"} — {p.normalMaxValue ?? "—"} {p.unit}</div>
              </div>
            )) : <div className="text-sm text-muted-foreground">No parameter results available.</div>}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Notes & Interpretation</h2>
          <div className="rounded-lg border p-4 text-sm text-foreground">{report.notes || "No notes provided."}</div>

          <h2 className="text-sm font-semibold text-muted-foreground">Meta</h2>
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            <div><strong>Reported at:</strong> {new Date(report.createdAt).toLocaleString()}</div>
            <div className="mt-2"><strong>Reported by:</strong> {report.doctorId?.name || report.doctorId || "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestReportDetailPage;
