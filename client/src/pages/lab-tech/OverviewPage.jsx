import { useEffect, useMemo, useState } from "react";
import { useLabTech } from "@/contexts/LabTechContext";
import { getDiagnosticTests, getLabBookings, getTestResults, } from "@/services/lab-tech.service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, CalendarDays, CheckCircle2, ClipboardList, Clock, ArrowRight, Loader2, Activity, ShieldCheck, AlertCircle, MapPin, Building2, } from "lucide-react";
import { Link } from "react-router-dom";
function formatDate(raw) {
    if (!raw)
        return "—";
    return new Date(raw).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}
function isToday(raw) {
    if (!raw)
        return false;
    const d = new Date(raw);
    const today = new Date();
    return (d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate());
}
const STATUS_STYLES = {
    CONFIRMED: "bg-info/10 text-info border-info/20",
    COMPLETED: "bg-success/10 text-success border-success/20",
    CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
};
export default function LabTechOverviewPage() {
    const { user, centerId, centerName, centerAddress, centerDistrict } = useLabTech();
    const [diagnosticTests, setDiagnosticTests] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [testResults, setTestResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        loadAll();
    }, [centerId]);
    async function loadAll() {
        try {
            setLoading(true);
            setError("");
            const [testsRes, bookingsRes, resultsRes] = await Promise.allSettled([
                centerId
                    ? getDiagnosticTests(centerId)
                    : Promise.resolve([]),
                centerId
                    ? getLabBookings(centerId)
                    : Promise.resolve([]),
                centerId
                    ? getTestResults(centerId)
                    : Promise.resolve([]),
            ]);
            if (testsRes.status === "fulfilled")
                setDiagnosticTests(testsRes.value);
            if (bookingsRes.status === "fulfilled")
                setBookings(bookingsRes.value);
            if (resultsRes.status === "fulfilled")
                setTestResults(resultsRes.value);
        }
        catch (err) {
            setError(err?.message || "Failed to load overview data");
        }
        finally {
            setLoading(false);
        }
    }
    const totalTestTypes = useMemo(() => diagnosticTests.length, [diagnosticTests]);
    const todayBookings = useMemo(() => bookings.filter((b) => isToday(b.slot?.slotDate) || isToday(b.appointmentDate)).length, [bookings]);
    const upcomingBookings = useMemo(() => bookings.filter((b) => b.appointmentStatus === "CONFIRMED").length, [bookings]);
    const completedTests = useMemo(() => bookings.filter((b) => b.appointmentStatus === "COMPLETED").length, [bookings]);
    const pendingResults = useMemo(() => testResults.filter((r) => r.status === "pending").length, [testResults]);
    const stats = [
        {
            title: "Test Types",
            value: totalTestTypes,
            label: "available",
            icon: FlaskConical,
            href: "/lab-tech/test-types",
            iconWrap: "bg-primary/10",
            iconColor: "text-primary",
        },
        {
            title: "Today's Bookings",
            value: todayBookings,
            label: "scheduled today",
            icon: CalendarDays,
            href: "/lab-tech/lab-bookings",
            iconWrap: "bg-amber-500/10",
            iconColor: "text-amber-600",
        },
        {
            title: "Upcoming",
            value: upcomingBookings,
            label: "confirmed",
            icon: Clock,
            href: "/lab-tech/lab-bookings",
            iconWrap: "bg-info/10",
            iconColor: "text-info",
        },
        {
            title: "Completed",
            value: completedTests,
            label: "finished",
            icon: CheckCircle2,
            href: "/lab-tech/lab-bookings",
            iconWrap: "bg-success/10",
            iconColor: "text-success",
        },
        {
            title: "Pending Results",
            value: pendingResults,
            label: "awaiting entry",
            icon: ClipboardList,
            href: "/lab-tech/update-results",
            iconWrap: "bg-orange-500/10",
            iconColor: "text-orange-600",
        },
    ];
    const recentBookings = useMemo(() => [...bookings].sort(() => -1).slice(0, 5), [bookings]);
    return (<div className="space-y-8 p-1 md:p-2">
      {/* Hero banner */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5"/>
              Lab Technician Dashboard
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {user?.name || "Lab Tech"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                {centerName
            ? `Here's a real-time overview of ${centerName}.`
            : "Here's a real-time overview of your lab."}
              </p>
              {(centerAddress || centerDistrict) && (<div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {centerAddress && (<span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5"/>
                      {centerAddress}
                    </span>)}
                  {centerDistrict && (<span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5"/>
                      {centerDistrict}
                    </span>)}
                </div>)}
            </div>
          </div>

          <Card className="w-full max-w-md rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <ShieldCheck className="h-7 w-7 text-primary"/>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Signed in as</p>
                  <p className="truncate text-base font-semibold">
                    {user?.name || "-"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {user?.email || "-"}
                  </p>
                  <Badge className="mt-2 rounded-full px-3 py-1 capitalize">
                    {user?.role || "lab-tech"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stat cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => (<Link key={stat.title} to={stat.href}>
              <Card className="h-full rounded-2xl border shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="mt-2 text-3xl font-bold">
                        {loading ? (<Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>) : (stat.value)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {loading ? "…" : stat.label}
                      </p>
                    </div>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.iconWrap}`}>
                      <stat.icon className={`h-5 w-5 ${stat.iconColor}`}/>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm font-medium text-muted-foreground">
                    View details <ArrowRight className="ml-2 h-4 w-4"/>
                  </div>
                </CardContent>
              </Card>
            </Link>))}
        </div>
      </div>

      {error && (<div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0"/>
          {error}
        </div>)}

      {/* Recent bookings */}
      <Card className="rounded-3xl border shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Recent Lab Bookings</h2>
              <p className="text-sm text-muted-foreground">
                Latest activity for this lab
              </p>
            </div>
            <Link to="/lab-tech/lab-bookings" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="h-4 w-4"/>
            </Link>
          </div>

          {loading ? (<div className="flex items-center justify-center rounded-2xl border border-dashed py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
              Loading...
            </div>) : recentBookings.length === 0 ? (<div className="rounded-2xl border border-dashed p-10 text-center">
              <FlaskConical className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/>
              <p className="text-sm font-medium">No lab bookings yet</p>
            </div>) : (<div className="space-y-3">
              {recentBookings.map((b) => {
                const status = b.appointmentStatus || "CONFIRMED";
                return (<div key={b._id} className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {b.diagnosticTest?.name || "Lab Test"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {b.user?.fullName || b.user?.name || "Patient"} •{" "}
                        {formatDate(b.slot?.slotDate || b.appointmentDate)}
                      </p>
                    </div>
                    <Badge variant="secondary" className={`shrink-0 rounded-full border px-3 py-1 text-[11px] ${STATUS_STYLES[status] ||
                        "border-transparent bg-muted text-muted-foreground"}`}>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </Badge>
                  </div>);
            })}
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
