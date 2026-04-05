import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Truck, PackageCheck } from "lucide-react";
import { toast } from "sonner";

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/pharmacy-orders");
        setOrders(Array.isArray(data) ? data : data?.items || data?.data || []);
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => !o.status || o.status === "pending" || o.status === "created").length;
    const fulfilled = orders.filter((o) => o.status === "fulfilled" || o.status === "completed").length;
    return { total, pending, fulfilled };
  }, [orders]);

  return (
    <div className="space-y-8 p-1 md:p-2">
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Truck className="h-3.5 w-3.5" />
              Pharmacy Orders
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pharmacy Orders</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Track incoming and fulfilled pharmacy orders.
              </p>
            </div>
          </div>

          <Card className="w-full max-w-md rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <PackageCheck className="h-7 w-7 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">Order Center</p>
                  <p className="truncate text-sm text-muted-foreground">Pending and fulfilled orders</p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="rounded-full">Pharmacist</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total orders</p>
              <p className="mt-2 text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="mt-2 text-2xl font-bold">{stats.pending}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Fulfilled</p>
              <p className="mt-2 text-2xl font-bold">{stats.fulfilled}</p>
            </CardContent>
          </Card>

          <div />
        </div>
      </div>

      <div>
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading orders...
          </div>
        ) : (
          <div className="grid gap-3">
            {orders.map((o, idx) => (
              <div key={o._id || idx} className="rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold">{o.orderNo || `Order #${idx + 1}`}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{o.customerName || o.customer || "Customer"}</p>
                  </div>

                  <div className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="outline" className="rounded-full capitalize">{o.status || "pending"}</Badge>
                  <div className="text-sm text-muted-foreground">{(o.items || []).length} items</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
