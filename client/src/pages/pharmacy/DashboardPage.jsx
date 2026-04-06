import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, ClipboardList, Truck, PackageCheck, Loader2 } from "lucide-react";
import { pharmacyApiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function PharmacyDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [meds, setMeds] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [medRes, orderRes] = await Promise.all([
          pharmacyApiFetch("/medication-inventory").catch(() => []),
          pharmacyApiFetch("/pharmacy-orders").catch(() => []),
        ]);

        setMeds(Array.isArray(medRes) ? medRes : medRes?.items || medRes?.data || []);
        setOrders(Array.isArray(orderRes) ? orderRes : orderRes?.items || orderRes?.data || []);
      } catch (err) {
        toast.error(err?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const totalMeds = meds.length;
    let lowStock = 0;
    meds.forEach((m) => {
      const total =
        m.totalQuantity ??
        (Array.isArray(m.batches)
          ? m.batches.reduce((s, b) => s + (b.quantity || 0), 0)
          : 0);
      if (total <= 10) lowStock += 1;
    });
    const pending = orders.filter(
      (o) => !o.status || o.status === "pending" || o.status === "created"
    ).length;
    const fulfilled = orders.filter(
      (o) => o.status === "fulfilled" || o.status === "completed"
    ).length;
    return { totalMeds, lowStock, pending, fulfilled };
  }, [meds, orders]);

  if (loading) {
    return (
      <div className="space-y-6 p-1 md:p-2">
        <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1 md:p-2">
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Pill className="h-3.5 w-3.5" />
              Pharmacy Dashboard
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome to Pharmacy</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Overview of medication inventory, low stock alerts, and order activity.
              </p>
            </div>
          </div>

          <Card className="w-full max-w-md rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Pill className="h-7 w-7 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">Pharmacy Center</p>
                  <p className="truncate text-sm text-muted-foreground">
                    Manage medications and orders
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full">Pharmacist</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Medications", value: stats.totalMeds, icon: Pill, color: "bg-primary/10", iconColor: "text-primary" },
            { label: "Low stock", value: stats.lowStock, icon: ClipboardList, color: "bg-amber-500/10", iconColor: "text-amber-600" },
            { label: "Pending orders", value: stats.pending, icon: Truck, color: "bg-sky-500/10", iconColor: "text-sky-600" },
            { label: "Fulfilled orders", value: stats.fulfilled, icon: PackageCheck, color: "bg-emerald-500/10", iconColor: "text-emerald-600" },
          ].map(({ label, value, icon: Icon, color, iconColor }) => (
            <Card key={label} className="rounded-2xl border shadow-none">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-2 text-2xl font-bold">{value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link to="/pharmacy/inventory" className="rounded-2xl border p-4 hover:bg-muted/30 transition-colors">
            View inventory →
          </Link>
          <Link to="/pharmacy/orders" className="rounded-2xl border p-4 hover:bg-muted/30 transition-colors">
            View orders →
          </Link>
        </div>
      </div>
    </div>
  );
}
