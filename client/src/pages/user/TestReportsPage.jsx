import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, Clock, MapPin, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
import { openTestResultPdf } from "@/services/lab-tech.service";

const STATUS_MAP = {
  pending: "pending",
  undergoing: "processing",
  completed: "completed",
};

function mapResult(r) {
  const appt = r.appointmentId || {};
  const slot = appt.slot || {};
  const center = appt.healthCenter || {};
  const testName = appt.diagnosticTest?.name || r.testTypeId?.name || "Test";
  const rawDate = slot?.slotDate || r.createdAt;
  const date = rawDate
    ? new Date(rawDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "—";
  const time = slot?.startTime ? (slot.endTime ? `${slot.startTime} — ${slot.endTime}` : slot.startTime) : "—";
  const status = r.status || "pending";
  return {
    id: r._id,
    testName,
    date,
    time,
    labLocation: center.name || "—",
    rawDate: slot?.slotDate || r.createdAt,
    status,
    raw: r,
  };
}

const TestReportsPage = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tab, setTab] = useState("all");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");
      const meRes = await apiFetch("/auth/me");
      const userId = meRes?.user?._id || meRes?.user?.id;
      if (!userId) {
        setError("Please log in first.");
        return;
      }
      const res = await apiFetch(`/test-results/patient/${userId}`);
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setReports(items.map(mapResult));
    } catch (err) {
      setError(err.message || "Failed to load test reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const filtered = reports.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = r.testName.toLowerCase().includes(q) || r.labLocation.toLowerCase().includes(q);
    const matchDate = !dateFilter || (r.rawDate && new Date(r.rawDate).toISOString().slice(0, 10) === dateFilter);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchTab = tab === "all" || (tab === "pending" ? r.status === "pending" : tab === "completed" ? r.status === "completed" : true);
    return matchSearch && matchDate && matchStatus && matchTab;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Test Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">View and download your diagnostic test reports</p>
        </div>
      </div>

      {error ? <div className="text-sm text-destructive">{error}</div> : null}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by test name or lab location..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-44" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-44">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="undergoing">Processing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <Tabs defaultValue="all" onValueChange={(v) => setTab(v)}>
        <TabsList>
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {/* content handled below */}
        </TabsContent>
      </Tabs>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading test reports...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">No test reports found</h2>
          <p className="text-muted-foreground">Reports will appear here when results are available.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <Card key={r.id} className="animate-fade-in">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{r.testName}</h3>
                    <div className="text-sm text-muted-foreground mt-1">{r.labLocation}</div>
                  </div>
                  <StatusBadge status={STATUS_MAP[r.status] ?? "pending"} />
                </div>

                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 shrink-0" />{r.labLocation}</div>
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 shrink-0" />{r.date}</div>
                  <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 shrink-0" />{r.time}</div>
                </div>

                <div className="flex items-center justify-end mt-4 pt-3 border-t border-border gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/user/test-reports/${r.id}`)}>
                    View
                  </Button>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); openTestResultPdf(r.id); }} disabled={r.status !== "completed"}>
                    <Download className="w-4 h-4 mr-2" /> Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestReportsPage;
