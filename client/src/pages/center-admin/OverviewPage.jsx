import { useEffect, useMemo, useState } from "react";
import { useCenterAdmin } from "@/contexts/CenterAdminContext";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, FileText, FlaskConical, CalendarDays, ArrowRight, Loader2, Activity, ShieldCheck, } from "lucide-react";
import { Link } from "react-router-dom";
function getCenterId(val, fallback) {
    if (!val)
        return false;
    if (typeof val === "string")
        return val === fallback;
    return (val._id || "") === fallback;
}
export default function CenterOverviewPage() {
    const { admin, centerId, centerName } = useCenterAdmin();
    const [doctors, setDoctors] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [labBookings, setLabBookings] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        loadAll();
    }, [centerId]);
    async function loadAll() {
        try {
            setLoading(true);
            setError("");
            const [doctorRes, prescriptionRes, bookingRes, slotRes] = await Promise.allSettled([
                apiFetch("/admin/doctors"),
                apiFetch("/prescriptions?limit=200"),
                centerId ? apiFetch(`/getappointments/${centerId}`) : Promise.resolve({ data: [] }),
                centerId ? apiFetch(`/getAvailableAppointmentSlots/${centerId}`) : Promise.resolve({ availableSlots: [] }),
            ]);
            if (doctorRes.status === "fulfilled") {
                const all = Array.isArray(doctorRes.value?.items) ? doctorRes.value.items : [];
                setDoctors(centerId ? all.filter((d) => getCenterId(d.centerId, centerId)) : all);
            }
            if (prescriptionRes.status === "fulfilled") {
                const all = Array.isArray(prescriptionRes.value?.data) ? prescriptionRes.value.data : [];
                setDrescriptions(all, centerId);
            }
            if (bookingRes.status === "fulfilled") {
                const raw = bookingRes.value;
                const all = raw?.data || (Array.isArray(raw) ? raw : []);
                setLabBookings(all);
            }
            if (slotRes.status === "fulfilled") {
                const raw = slotRes.value;
                setSlots(raw?.availableSlots || raw?.data || (Array.isArray(raw) ? raw : []));
            }
        }
        catch (err) {
            setError(err?.message || "Failed to load overview data");
        }
        finally {
            setLoading(false);
        }
    }
    function setDrescriptions(all, cid) {
        if (!cid) {
            setPrescriptions(all);
            return;
        }
        setPrescriptions(all.filter((p) => getCenterId(p.centerId, cid)));
    }
    const activeDoctors = useMemo(() => doctors.filter((d) => d.isActive).length, [doctors]);
    const upcomingBookings = useMemo(() => labBookings.filter((b) => b.appointmentStatus === "CONFIRMED").length, [labBookings]);
    const issuedPrescriptions = useMemo(() => prescriptions.filter((p) => p.status === "issued").length, [prescriptions]);
    const availableSlots = useMemo(() => slots.length, [slots]);
    const stats = [
        {
            title: "Doctors",
            value: activeDoctors,
            total: doctors.length,
            label: "active",
            icon: Stethoscope,
            href: "/center-admin/doctors",
            iconWrap: "bg-primary/10",
            iconColor: "text-primary",
        },
        {
            title: "Lab Bookings",
            value: upcomingBookings,
            total: labBookings.length,
            label: "upcoming",
            icon: FlaskConical,
            href: "/center-admin/lab-bookings",
            iconWrap: "bg-emerald-500/10",
            iconColor: "text-emerald-600",
        },
        {
            title: "Prescriptions",
            value: issuedPrescriptions,
            total: prescriptions.length,
            label: "issued",
            icon: FileText,
            href: "/center-admin/prescriptions",
            iconWrap: "bg-amber-500/10",
            iconColor: "text-amber-600",
        },
        {
            title: "Available Slots",
            value: availableSlots,
            total: availableSlots,
            label: "open",
            icon: CalendarDays,
            href: "/center-admin/slot-management",
            iconWrap: "bg-violet-500/10",
            iconColor: "text-violet-600",
        },
    ];
    return (<div className="space-y-8 p-1 md:p-2">
      {/* Hero banner */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5"/>
              Center Admin Dashboard
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {admin?.name || "Admin"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                {centerName
            ? `Here's a real-time overview of ${centerName}.`
            : "Here's a real-time overview of your health center."}
              </p>
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
                  <p className="truncate text-base font-semibold">{admin?.name || "-"}</p>
                  <p className="truncate text-sm text-muted-foreground">{admin?.email || "-"}</p>
                  <Badge className="mt-2 rounded-full px-3 py-1 capitalize">
                    {admin?.role || "center-admin"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stat cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (<Link key={stat.title} to={stat.href}>
              <Card className="h-full rounded-2xl border shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="mt-2 text-3xl font-bold">
                        {loading ? (<Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>) : (stat.value)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {loading ? "…" : `${stat.label} of ${stat.total} total`}
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

      {error && (<div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>)}

      {/* Recent lab bookings */}
      <Card className="rounded-3xl border shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">Recent Lab Bookings</h2>
              <p className="text-sm text-muted-foreground">Latest activity for this center</p>
            </div>
            <Link to="/center-admin/lab-bookings" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="h-4 w-4"/>
            </Link>
          </div>

          {loading ? (<div className="flex items-center justify-center rounded-2xl border border-dashed py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
              Loading...
            </div>) : labBookings.length === 0 ? (<div className="rounded-2xl border border-dashed p-10 text-center">
              <FlaskConical className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/>
              <p className="text-sm font-medium">No lab bookings yet</p>
            </div>) : (<div className="space-y-3">
              {labBookings.slice(0, 5).map((b) => {
                const raw = b;
                const statusColors = {
                    CONFIRMED: "bg-info/10 text-info border-info/20",
                    COMPLETED: "bg-success/10 text-success border-success/20",
                    CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
                };
                const status = b.appointmentStatus || "CONFIRMED";
                return (<div key={b._id} className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {raw?.diagnosticTest?.name || "Lab Test"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {raw?.slot?.startTime
                        ? `${raw.slot.startTime}${raw.slot.endTime ? ` — ${raw.slot.endTime}` : ""}`
                        : raw?.appointmentDate
                            ? new Date(raw.appointmentDate).toLocaleDateString()
                            : "—"}
                      </p>
                    </div>
                    <Badge variant="secondary" className={`rounded-full border px-3 py-1 text-[11px] shrink-0 ${statusColors[status] || "bg-muted text-muted-foreground border-transparent"}`}>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </Badge>
                  </div>);
            })}
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
