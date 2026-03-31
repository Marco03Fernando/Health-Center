import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, FileText, Building2, Users, ArrowRight, Loader2, Pill, ShieldCheck, Activity, } from "lucide-react";
import { Link } from "react-router-dom";
function formatDate(value) {
    if (!value)
        return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime()))
        return value;
    return d.toLocaleDateString();
}
function getPrescriptionStatusClass(status) {
    if (status === "issued")
        return "bg-primary/10 text-primary border-primary/20";
    if (status === "dispensed")
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    if (status === "cancelled")
        return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-muted text-muted-foreground border-transparent";
}
export default function AdminDashboardPage() {
    const { admin } = useAdminAuth();
    const [doctors, setDoctors] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        loadDashboardData();
    }, []);
    async function loadDashboardData() {
        try {
            setLoading(true);
            setError("");
            const [doctorRes, prescriptionRes, centerRes] = await Promise.all([
                apiFetch("/admin/doctors"),
                apiFetch("/prescriptions?limit=100"),
                apiFetch("/centers/admin/all"),
            ]);
            setDoctors(Array.isArray(doctorRes?.items) ? doctorRes.items : []);
            setPrescriptions(Array.isArray(prescriptionRes?.data) ? prescriptionRes.data : []);
            setCenters(Array.isArray(centerRes?.data) ? centerRes.data : []);
        }
        catch (err) {
            setError(err?.message || "Failed to load dashboard data");
            setDoctors([]);
            setPrescriptions([]);
            setCenters([]);
        }
        finally {
            setLoading(false);
        }
    }
    const activeDoctors = useMemo(() => doctors.filter((d) => d.isActive).length, [doctors]);
    const issuedPrescriptions = useMemo(() => prescriptions.filter((p) => p.status === "issued").length, [prescriptions]);
    const activeCenters = useMemo(() => centers.filter((c) => c.isActive).length, [centers]);
    const totalPatients = useMemo(() => {
        const ids = new Set();
        prescriptions.forEach((p) => { if (p.userId?._id)
            ids.add(p.userId._id); });
        return ids.size;
    }, [prescriptions]);
    const recentPrescriptions = useMemo(() => [...prescriptions]
        .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime())
        .slice(0, 5), [prescriptions]);
    const stats = [
        { title: "Active Doctors", value: activeDoctors, total: doctors.length, icon: Stethoscope, href: "/admin/doctors", iconWrap: "bg-primary/10", iconColor: "text-primary" },
        { title: "Issued Prescriptions", value: issuedPrescriptions, total: prescriptions.length, icon: FileText, href: "/admin/prescriptions", iconWrap: "bg-amber-500/10", iconColor: "text-amber-600" },
        { title: "Active Centers", value: activeCenters, total: centers.length, icon: Building2, href: "/admin/centers", iconWrap: "bg-emerald-500/10", iconColor: "text-emerald-600" },
        { title: "Total Patients", value: totalPatients, total: totalPatients, icon: Users, href: "/admin/prescriptions", iconWrap: "bg-violet-500/10", iconColor: "text-violet-600" },
    ];
    return (<div className="space-y-8 p-1 md:p-2">
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5"/>
              Admin Dashboard
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {admin?.name || "Admin"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Here's a real-time overview of your healthcare platform.
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
                    {admin?.role || "admin"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (<Link key={stat.title} to={stat.href}>
              <Card className="h-full rounded-2xl border shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="mt-2 text-3xl font-bold">{loading ? "--" : stat.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">of {loading ? "--" : stat.total} total</p>
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

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-3xl border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Recent Prescriptions</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Latest prescription activity.</p>
              </div>
              <Link to="/admin/prescriptions">
                <Badge variant="outline" className="rounded-full px-3 py-1">View all</Badge>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (<div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin"/> Loading prescriptions...
              </div>) : recentPrescriptions.length === 0 ? (<div className="rounded-2xl border border-dashed p-10 text-center">
                <Pill className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/>
                <p className="text-sm font-medium">No prescriptions found</p>
              </div>) : (<div className="space-y-3">
                {recentPrescriptions.map((rx) => (<div key={rx._id || rx.id || rx.prescriptionNo} className="flex flex-col gap-3 rounded-2xl border p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{rx.prescriptionNo || "Prescription"}</p>
                        <Badge variant="secondary" className={`rounded-full border px-3 py-1 text-[11px] ${getPrescriptionStatusClass(rx.status)}`}>
                          {rx.status || "unknown"}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {rx.userId?.fullName || "Unknown Patient"} — {rx.doctorId?.name || "Unknown Doctor"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {rx.centerId?.name || "No center"} • {formatDate(rx.createdAt || rx.updatedAt)}
                      </p>
                    </div>
                    <Link to="/admin/prescriptions" className="shrink-0">
                      <Badge variant="outline" className="rounded-full px-3 py-1">Open</Badge>
                    </Link>
                  </div>))}
              </div>)}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-3xl border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Admin Profile</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <span className="text-2xl font-bold text-primary">
                    {admin?.name?.charAt(0)?.toUpperCase() || "A"}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">{admin?.name || "-"}</p>
                  <p className="truncate text-sm text-muted-foreground">{admin?.email || "-"}</p>
                  <Badge className="mt-2 rounded-full px-3 py-1 capitalize">{admin?.role || "admin"}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Platform Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {[
            { label: "Doctors", value: doctors.length },
            { label: "Centers", value: centers.length },
            { label: "Prescriptions", value: prescriptions.length },
            { label: "Unique Patients", value: totalPatients },
        ].map((row) => (<div key={row.label} className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-semibold">{loading ? "--" : row.value}</span>
                  </div>))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);
}
