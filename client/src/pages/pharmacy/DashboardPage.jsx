import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pill,
  ClipboardList,
  Truck,
  PackageCheck,
  Loader2,
  ArrowRight,
  LayoutGrid,
  ShieldCheck,
  AlertCircle,
  PlusCircle,
  FileText,
  TrendingUp,
  Clock,
} from "lucide-react";
import { usePharmacyAuth } from "@/contexts/PharmacyAuthContext";
import { pharmacyApiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// Helper: format date
function formatDate(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Helper: check if a date is today
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

export default function PharmacyDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [meds, setMeds] = useState([]);
  const [orders, setOrders] = useState([]);
  const { pharmacist } = usePharmacyAuth();

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

  // Compute statistics
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

    // Normalize status to lowercase for comparisons
    const normalized = (s) => (s ? String(s).toLowerCase() : "");

    // Pending orders: those waiting for stock or not yet confirmed
    const pending = orders.filter((o) => {
      const st = normalized(o.status);
      return st === "waiting_stock" || st === "waiting-stock" || st === "waiting" || st === "created" || st === "pending" || !st;
    }).length;

    // Fulfilled / confirmed orders
    const fulfilled = orders.filter((o) => {
      const st = normalized(o.status);
      return st === "confirmed" || st === "fulfilled" || st === "completed";
    }).length;

    // Today fulfilled: use confirmedAt when present, otherwise createdAt
    const todayFulfilled = orders.filter((o) => {
      const st = normalized(o.status);
      if (!(st === "confirmed" || st === "fulfilled" || st === "completed")) return false;
      const dt = o.confirmedAt || o.confirmedAt === 0 ? o.confirmedAt : o.createdAt;
      return isToday(dt || o.createdAt);
    }).length;

    return { totalMeds, lowStock, pending, fulfilled, todayFulfilled };
  }, [meds, orders]);

  // Stats cards (clickable links)
  const statsCards = [
    {
      title: "Medications",
      value: stats.totalMeds,
      label: "total in inventory",
      icon: Pill,
      href: "/pharmacy/inventory",
      iconWrap: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Low Stock",
      value: stats.lowStock,
      label: "items ≤10 units",
      icon: AlertCircle,
      href: "/pharmacy/inventory?filter=lowstock",
      iconWrap: "bg-amber-100",
      iconColor: "text-amber-700",
    },
    {
      title: "Pending Orders",
      value: stats.pending,
      label: "awaiting fulfillment",
      icon: Clock,
      href: "/pharmacy/orders?status=pending",
      iconWrap: "bg-sky-100",
      iconColor: "text-sky-700",
    },
    {
      title: "Fulfilled Orders",
      value: stats.fulfilled,
      label: "completed orders",
      icon: PackageCheck,
      href: "/pharmacy/orders?status=fulfilled",
      iconWrap: "bg-emerald-100",
      iconColor: "text-emerald-700",
    },
    {
      title: "Today Fulfilled",
      value: stats.todayFulfilled,
      label: "orders completed today",
      icon: TrendingUp,
      href: "/pharmacy/orders?status=fulfilled",
      iconWrap: "bg-green-100",
      iconColor: "text-green-700",
    },
  ];

  // Quick access cards
  const quickLinks = [
    {
      title: "Inventory",
      icon: PackageCheck,
      href: "/pharmacy/inventory",
      desc: "Manage medications and batches",
      iconWrap: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Orders",
      icon: Truck,
      href: "/pharmacy/orders",
      desc: "View and process orders",
      iconWrap: "bg-sky-100",
      iconColor: "text-sky-700",
    },
    {
      title: "Add Medication",
      icon: PlusCircle,
      href: "/pharmacy/inventory/new",
      desc: "Create a new medication",
      iconWrap: "bg-violet-100",
      iconColor: "text-violet-700",
    },
    {
      title: "Profile",
      icon: FileText,
      href: "/pharmacy/profile",
      desc: "Update your pharmacy profile",
      iconWrap: "bg-emerald-100",
      iconColor: "text-emerald-700",
    },
  ];

  // Recent orders (sorted, limited to 5)
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [orders]);

  // Loading state
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
      {/* Header Section (matching Lab Tech) */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Pill className="h-3.5 w-3.5" />
              Pharmacy Dashboard
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {pharmacist?.name || "Pharmacist"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Manage medications, track inventory, and fulfill orders from your pharmacy.
              </p>
            </div>
          </div>

          {/* Pharmacist Info Card */}
          <Card className="w-full max-w-md rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Signed in as</p>
                  <p className="truncate text-base font-semibold">
                    {pharmacist?.name || "-"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {pharmacist?.email || "-"}
                  </p>
                  <Badge className="mt-2 rounded-full px-3 py-1 capitalize">
                    {pharmacist?.role || "pharmacist"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards Grid (clickable) */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {statsCards.map((stat) => (
            <Link key={stat.title} to={stat.href}>
              <Card className="h-full rounded-2xl border shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {stat.label}
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

      {/* Quick Access Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Quick Access</h2>
          <p className="text-sm text-muted-foreground">
            Jump directly to common pharmacy pages
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

      {/* Recent Orders Section (similar to Recent Lab Bookings) */}
      <Card className="rounded-3xl border shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Recent Orders</h2>
              <p className="text-sm text-muted-foreground">Latest pharmacy order activity</p>
            </div>
            <Link
              to="/pharmacy/orders"
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
          ) : recentOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <LayoutGrid className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const st = (order.status || "").toString().toLowerCase();
                const isFulfilled = st === "confirmed" || st === "fulfilled" || st === "completed";
                const isPending = st === "waiting_stock" || st === "waiting-stock" || st === "waiting" || st === "created" || st === "pending" || !st;
                const statusColor = isFulfilled
                  ? "bg-green-100 text-green-800"
                  : isPending
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800";

                const displayStatus = isFulfilled ? "confirmed" : isPending ? "waiting" : (order.status || "unknown");

                return (
                  <div
                    key={order._id}
                    className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {order.orderNo || `Order ${order._id?.slice(-6) || ""}`}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.customerName || order.customer || "Customer"} • {formatDate(order.createdAt)}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        Items: {(order.items || []).length}
                      </p>
                    </div>
                    <Badge className={`ml-2 capitalize ${statusColor}`}>
                      {displayStatus}
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