import { useEffect, useMemo, useState } from "react";
import { useLabTech } from "@/contexts/LabTechContext";
import {
  getTestTypes,
  getAllLabBookings,
  getTestResults,
} from "@/services/lab-tech.service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  ArrowRight,
  Loader2,
  Activity,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Building2,
  PlusCircle,
  TestTube2,
  FilePenLine,
  LayoutGrid,
} from "lucide-react";
import { Link } from "react-router-dom";

function formatDate(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isToday(raw) {
  if (!raw) return false;

  const d = new Date(raw);
  const today = new Date();

  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function getBookingDate(booking) {
  return booking?.slot?.slotDate || booking?.appointmentDate || booking?.createdAt || null;
}

function normalizeStatus(status) {
  if (status === "CONFIRMED") return "PENDING";
  return status;
}

function formatStatusLabel(status) {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case "PENDING":
      return "Pending";
    case "UNDERGOING":
      return "Undergoing";
    case "RESULT_PENDING":
      return "Results Pending";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return normalized || "Unknown";
  }
}

const STATUS_STYLES = {
  PENDING: "bg-yellow-100 text-yellow-800",
  UNDERGOING: "bg-blue-100 text-blue-800",
  RESULT_PENDING: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function LabTechOverviewPage() {
  const { user, centerId, centerName, centerAddress, centerDistrict } = useLabTech();

  const [testTypes, setTestTypes] = useState([]);
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

      const [testsRes, bookingsRes, resultsRes] = await Promise.all([
        getTestTypes(centerId),
        getAllLabBookings(),
        getTestResults(),
      ]);

      setTestTypes(Array.isArray(testsRes) ? testsRes : []);
      setBookings(Array.isArray(bookingsRes) ? bookingsRes : []);
      setTestResults(Array.isArray(resultsRes) ? resultsRes : []);
    } catch (err) {
      console.error("Overview load error:", err);
      setError(err?.message || "Failed to load overview data.");
      setTestTypes([]);
      setBookings([]);
      setTestResults([]);
    } finally {
      setLoading(false);
    }
  }

  const totalTestTypes = useMemo(() => testTypes.length, [testTypes]);

  const pendingTests = useMemo(() => {
    return bookings.filter(
      (b) => normalizeStatus(b?.appointmentStatus) === "PENDING"
    ).length;
  }, [bookings]);

  const undergoingTests = useMemo(() => {
    return bookings.filter(
      (b) => normalizeStatus(b?.appointmentStatus) === "UNDERGOING"
    ).length;
  }, [bookings]);

  const resultsPendingTests = useMemo(() => {
    return bookings.filter(
      (b) => normalizeStatus(b?.appointmentStatus) === "RESULT_PENDING"
    ).length;
  }, [bookings]);

  const todayCompletedTests = useMemo(() => {
    return testResults.filter((r) => isToday(r?.createdAt)).length;
  }, [testResults]);

  const stats = [
    {
      title: "Test Types",
      value: totalTestTypes,
      label: "available tests",
      icon: FlaskConical,
      href: "/lab-tech/test-types",
      iconWrap: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Pending Tests",
      value: pendingTests,
      label: "waiting to start",
      icon: Clock,
      href: "/lab-tech/lab-bookings",
      iconWrap: "bg-yellow-100",
      iconColor: "text-yellow-800",
    },
    {
      title: "Undergoing Tests",
      value: undergoingTests,
      label: "currently active",
      icon: Activity,
      href: "/lab-tech/lab-bookings",
      iconWrap: "bg-blue-100",
      iconColor: "text-blue-800",
    },
    {
      title: "Results Pending",
      value: resultsPendingTests,
      label: "waiting for entry",
      icon: ClipboardList,
      href: "/lab-tech/update-results",
      iconWrap: "bg-purple-100",
      iconColor: "text-purple-800",
    },
    {
      title: "Today Completed",
      value: todayCompletedTests,
      label: "results created today",
      icon: CheckCircle2,
      href: "/lab-tech/update-results",
      iconWrap: "bg-green-100",
      iconColor: "text-green-800",
    },
  ];

  const quickLinks = [
    {
      title: "Add Diagnostic Test",
      icon: PlusCircle,
      href: "/lab-tech/add-test",
      desc: "Create a new test type",
      iconWrap: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Test Types",
      icon: TestTube2,
      href: "/lab-tech/test-types",
      desc: "View and manage test types",
      iconWrap: "bg-violet-100",
      iconColor: "text-violet-700",
    },
    {
      title: "Lab Bookings",
      icon: CalendarDays,
      href: "/lab-tech/lab-bookings",
      desc: "Manage all bookings",
      iconWrap: "bg-sky-100",
      iconColor: "text-sky-700",
    },
    {
      title: "Update Results",
      icon: FilePenLine,
      href: "/lab-tech/update-results",
      desc: "Enter and manage results",
      iconWrap: "bg-emerald-100",
      iconColor: "text-emerald-700",
    },
  ];

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => {
        const dateA = new Date(getBookingDate(a) || 0).getTime();
        const dateB = new Date(getBookingDate(b) || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [bookings]);

  return (
    <div className="space-y-8 p-1 md:p-2">
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              Lab Technician Dashboard
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {user?.name || "Lab Tech"}
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                {centerName
                  ? `Here's a live overview of ${centerName}.`
                  : "Here's a live overview of your lab."}
              </p>

              {(centerAddress || centerDistrict) && (
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {centerAddress && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {centerAddress}
                    </span>
                  )}
                  {centerDistrict && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {centerDistrict}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <Card className="w-full max-w-md rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <ShieldCheck className="h-7 w-7 text-primary" />
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => (
            <Link key={stat.title} to={stat.href}>
              <Card className="h-full rounded-2xl border shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="mt-2 text-3xl font-bold">
                        {loading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                          stat.value
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {loading ? "…" : stat.label}
                      </p>
                    </div>

                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.iconWrap}`}
                    >
                      <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center text-sm font-medium text-muted-foreground">
                    View details <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Quick Access</h2>
          <p className="text-sm text-muted-foreground">
            Jump directly to the main lab technician pages
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((item) => (
            <Link key={item.title} to={item.href}>
              <Card className="h-full rounded-3xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex h-full min-h-[180px] flex-col justify-between p-6">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.iconWrap}`}
                  >
                    <item.icon className={`h-7 w-7 ${item.iconColor}`} />
                  </div>

                  <div className="mt-6">
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </div>

                  <div className="mt-6 flex items-center text-sm font-medium text-primary">
                    Open page <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Card className="rounded-3xl border shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Recent Lab Bookings</h2>
              <p className="text-sm text-muted-foreground">
                Latest activity for this lab
              </p>
            </div>

            <Link
              to="/lab-tech/lab-bookings"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading...
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <LayoutGrid className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No lab bookings yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => {
                const status = normalizeStatus(b?.appointmentStatus);

                return (
                  <div
                    key={b._id}
                    className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {b?.diagnosticTest?.name || "Diagnostic Test"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {b?.user?.fullName || b?.user?.name || "Patient"} •{" "}
                        {formatDate(getBookingDate(b))}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        Appointment ID: {b?._id || "—"}
                      </p>
                    </div>

                    <Badge className={`ml-2 ${STATUS_STYLES[status] || ""}`}>
                      {formatStatusLabel(status)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}