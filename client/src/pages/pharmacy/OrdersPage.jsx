import { useEffect, useMemo, useState } from "react";
import { pharmacyApiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Truck, PackageCheck, CheckSquare, PlusSquare, Trash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function PharmacyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [formItems, setFormItems] = useState([]);

  useEffect(() => {
    setLoading(true);
    pharmacyApiFetch("/pharmacy-orders")
      .then((data) => setOrders(Array.isArray(data) ? data : data?.items || data?.data || []))
      .catch((e) => toast.error(e?.message || "Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // load inventory for pharmacist to choose items
    pharmacyApiFetch("/medication-inventory")
      .then((data) => setInventory(Array.isArray(data) ? data : data?.items || data?.data || []))
      .catch(() => setInventory([]));
  }, []);

  const openCompleteDialog = (order) => {
    setSelectedOrder(order);
    // initialize form items from prescription snapshot lines (best-effort)
    const lines = (order.prescriptionTextSnapshot || "").split("\n");
    // try to parse medicine lines starting with '- '
    const meds = lines.filter((l) => l.trim().startsWith("- ")).map((l) => {
      const t = l.replace(/^-\s*/, "");
      const parts = t.split(/x(\d+)/i);
      const name = parts[0] ? parts[0].trim() : t;
      const qtyMatch = t.match(/x(\d+)/i);
      const qty = qtyMatch ? Number(qtyMatch[1]) : 1;
      // try to auto-match with inventory
      const match = inventory.find((m) => {
        if (!m?.name) return false;
        const mn = String(m.name).toLowerCase();
        const nn = String(name).toLowerCase();
        return mn.includes(nn) || nn.includes(mn) || mn.split(' ')[0] === nn.split(' ')[0];
      });
      return { name, qty, medicationId: match?._id || "", instructions: "" };
    });

    // if no parsed meds, create a single empty row
    setFormItems(meds.length > 0 ? meds : [{ name: "", qty: 1, medicationId: "", instructions: "" }]);
    setDialogOpen(true);
  };

  const openOrderDetail = (order) => {
    setDetailOrder(order);
    setDetailOpen(true);
  };

  const closeOrderDetail = () => {
    setDetailOpen(false);
    setDetailOrder(null);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedOrder(null);
    setFormItems([]);
  };

  const updateFormItem = (idx, patch) => {
    setFormItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const submitComplete = async () => {
    if (!selectedOrder) return;
    const payloadItems = formItems
      .map((it) => ({ medicationId: it.medicationId, qty: Number(it.qty) || 1, instructions: it.instructions }))
      .filter((it) => it.medicationId && it.qty > 0);

    if (payloadItems.length === 0) {
      toast.error("Add at least one medication with a selected inventory item");
      return;
    }

    try {
      await pharmacyApiFetch(`/pharmacy-orders/${selectedOrder._id}/items`, {
        method: "PUT",
        body: JSON.stringify({ items: payloadItems }),
      });

      toast.success("Order completed and invoice emailed");
      // refresh orders
      setLoading(true);
      const data = await pharmacyApiFetch("/pharmacy-orders");
      setOrders(Array.isArray(data) ? data : data?.items || data?.data || []);
      setLoading(false);
      closeDialog();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to complete order");
    }
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const normalized = (s) => (s ? String(s).toLowerCase() : "");

    const pending = orders.filter((o) => {
      const st = normalized(o.status);
      return st === "waiting_stock" || st === "waiting-stock" || st === "waiting" || st === "created" || st === "pending" || !st;
    }).length;

    const fulfilled = orders.filter((o) => {
      const st = normalized(o.status);
      return st === "confirmed" || st === "fulfilled" || st === "completed";
    }).length;

    return { total, pending, fulfilled };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    return orders.filter((o) => {
      const st = (o.status || "").toString().toLowerCase();
      if (statusFilter !== "all") {
        if (statusFilter === "pending") {
          if (!(st === "waiting_stock" || st === "waiting" || st === "created" || st === "pending" || !st)) return false;
        } else if (statusFilter === "fulfilled") {
          if (!(st === "confirmed" || st === "fulfilled" || st === "completed")) return false;
        }
      }

      if (!q) return true;
      // match orderNo, patient name, prescription text, item names
      if ((o.orderNo || "").toLowerCase().includes(q)) return true;
      if ((o.patient?.name || o.customerName || o.customer || "").toLowerCase().includes(q)) return true;
      if ((o.prescriptionTextSnapshot || "").toLowerCase().includes(q)) return true;
      const itemMatch = (o.items || []).some((it) => (it.nameSnapshot || it.name || it.medicineName || "").toLowerCase().includes(q));
      if (itemMatch) return true;
      return false;
    });
  }, [orders, search, statusFilter]);

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

          {/* (Search moved below stats for full-width layout) */}

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
                <Badge variant="outline" className="rounded-full">Pharmacist</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search / Filter placed under stats for full-width alignment */}
        <div className="mt-4 flex items-center gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders, patient, medicine..." className="w-full rounded-md border px-3 py-2" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border px-3 py-2">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="fulfilled">Fulfilled</option>
          </select>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { title: "Total orders", value: stats.total, label: "all orders" },
            { title: "Pending", value: stats.pending, label: "awaiting fulfillment" },
            { title: "Fulfilled", value: stats.fulfilled, label: "completed orders" },
          ].map((s) => (
            <Card key={s.title} className="h-full rounded-3xl border shadow-none">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.title}</p>
                    <p className="mt-2 text-3xl font-bold">{s.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
            {filteredOrders.map((o, idx) => (
              <div key={o._id || idx} className="rounded-2xl border p-4 cursor-pointer hover:shadow-sm" onClick={() => openOrderDetail(o)}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold">
                      {o.orderNo || `Order #${idx + 1}`}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {o.patient?.name || o.customerName || o.customer || "Customer"}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="outline" className="rounded-full capitalize">
                    {o.status || "pending"}
                  </Badge>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">{(o.items || []).length} items</div>
                    {o.status !== "CONFIRMED" && (
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openCompleteDialog(o); }}>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Complete order
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-center py-12 text-muted-foreground">No orders found.</p>
            )}
          </div>
        )}
      </div>
      {/* Complete order dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Review prescription and allocate medications from inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4 space-y-3">
            <div className="rounded-md border p-3">
              <pre className="whitespace-pre-wrap text-sm">{selectedOrder?.prescriptionTextSnapshot}</pre>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Medications to allocate</h4>
              <div className="space-y-2">
                {formItems.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Select value={it.medicationId} onValueChange={(v) => updateFormItem(i, { medicationId: v })}>
                        <SelectTrigger className="w-full">
                          <SelectValue>{it.medicationId ? inventory.find((m)=>m._id===it.medicationId)?.name : (it.name || "Select medication")}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {inventory.map((m) => (
                            <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input type="number" min={1} value={it.qty} onChange={(e)=>updateFormItem(i,{qty: e.target.value})} />
                    </div>
                    <div className="col-span-4">
                      <Input value={it.instructions} placeholder="Instructions (optional)" onChange={(e)=>updateFormItem(i,{instructions: e.target.value})} />
                    </div>
                    <div className="col-span-1">
                      <Button size="sm" variant="ghost" onClick={()=> setFormItems(prev => prev.filter((_,idx)=>idx!==i))}>
                        <Trash className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div>
                  <Button size="sm" onClick={()=> setFormItems(prev=>[...prev,{ name: "", qty:1, medicationId:"", instructions:"" }])}>Add row</Button>
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitComplete}>Complete Order</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
          {/* Order detail dialog */}
          <AlertDialog open={detailOpen} onOpenChange={setDetailOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Order Details</AlertDialogTitle>
                <AlertDialogDescription>View full order information and prescription snapshot.</AlertDialogDescription>
              </AlertDialogHeader>

              <div className="mt-4 space-y-3">
                <div className="rounded-md border p-3">
                  <p className="font-medium">Order: {detailOrder?.orderNo || detailOrder?._id}</p>
                  <p className="text-sm text-muted-foreground">{detailOrder?.patient?.name || detailOrder?.customerName}</p>
                  <p className="text-xs text-muted-foreground">{detailOrder ? new Date(detailOrder.createdAt).toLocaleString() : ""}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Prescription</h4>
                  <div className="rounded-md border p-3">
                    <pre className="whitespace-pre-wrap text-sm">{detailOrder?.prescriptionTextSnapshot || 'No prescription snapshot'}</pre>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Items</h4>
                  <div className="space-y-2">
                    {(detailOrder?.items || []).map((it, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <div>
                          <div className="font-medium">{it.nameSnapshot || it.name || it.medicineName || 'Medicine'}</div>
                          <div className="text-xs text-muted-foreground">{it.instructions}</div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">Qty: {it.requestedQty || it.qty || it.quantity || 1}</div>
                      </div>
                    ))}
                    {(!detailOrder?.items || detailOrder.items.length === 0) && (
                      <div className="text-sm text-muted-foreground">No items allocated yet.</div>
                    )}
                  </div>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel onClick={closeOrderDetail}>Close</AlertDialogCancel>
                {detailOrder && detailOrder.status !== 'CONFIRMED' && (
                  <AlertDialogAction onClick={() => { setDetailOpen(false); setTimeout(()=>openCompleteDialog(detailOrder), 150); }}>Open Complete Order</AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
    </div>
  );
}
