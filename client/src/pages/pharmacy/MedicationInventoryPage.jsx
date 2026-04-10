import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { pharmacyApiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Loader2, Pill, Trash2, Edit2, Layers } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const FORM_OPTIONS = ["tablet", "capsule", "syrup", "injection", "cream", "drops", "other"];

function formatDateTime(iso) {
  return iso ? new Date(iso).toLocaleString() : "";
}

function formatNumber(v) {
  return typeof v === "number"
    ? new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
    : "";
}

function getAverageUnitPrice(batches) {
  const totalQty = batches.reduce((s, b) => s + (b?.quantity || 0), 0);
  if (totalQty > 0) {
    const weighted = batches.reduce((sum, b) => sum + (b?.unitPrice || 0) * (b?.quantity || 0), 0);
    return formatNumber(weighted / totalQty);
  }
  return batches[0]?.unitPrice ? formatNumber(batches[0].unitPrice) : "";
}

async function fetchMeds(setMeds) {
  const data = await pharmacyApiFetch("/medication-inventory");
  setMeds(Array.isArray(data) ? data : data?.items || data?.data || []);
}

export default function MedicationInventoryPage() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [batchesMed, setBatchesMed] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Export current inventory to PDF (requires jspdf and jspdf-autotable)
  const exportInventoryPdf = async () => {
    try {
      // runtime-safe constructor lookup (some bundlers expose jspdf differently)
      const PDFCtor = typeof jsPDF !== "undefined" ? jsPDF : (typeof window !== "undefined" && window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : null;
      if (!PDFCtor) throw new Error('jsPDF not available (import failed or unresolved).');
      const doc = new PDFCtor();

      // Header / brand area - use app `info` color (HSL 210 80% 52% -> RGB approx 35,133,231)
      doc.setFillColor(35, 133, 231);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('Medicare', 14, 18);

      // (logo removed for cleaner PDF header)

      // Table columns + rows
      const head = [['Name', 'Brand', 'Strength', 'Total Qty', 'Avg Unit Price', 'Batches']];
      const body = (meds || []).map((m) => {
        const totalQty = m.totalQuantity ?? (Array.isArray(m.batches) ? m.batches.reduce((s, b) => s + (b.quantity || 0), 0) : 0);
        const avg = getAverageUnitPrice(m.batches || []);
        return [m.name || '-', m.brandName || '-', m.strength || '-', String(totalQty), avg || '-', String((m.batches || []).length)];
      });

      doc.setTextColor(0,0,0);
      // jspdf-autotable v5 exports a function; prefer calling autoTable(doc, ...) but
      // fall back to doc.autoTable if attached to the instance.
      if (typeof autoTable === 'function') {
        autoTable(doc, {
          startY: 36,
          head: head,
          body: body,
          styles: { fontSize: 10, cellPadding: 6 },
          headStyles: { fillColor: [245,245,245], textColor: [35,133,231], fontStyle: 'bold' },
          theme: 'striped',
        });
      } else if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: 36,
          head: head,
          body: body,
          styles: { fontSize: 10, cellPadding: 6 },
          headStyles: { fillColor: [245,245,245], textColor: [35,133,231], fontStyle: 'bold' },
          theme: 'striped',
        });
      } else {
        throw new Error('jspdf-autotable not available (autoTable function not found)');
      }

      doc.save('medicare-inventory.pdf');
    } catch (err) {
      console.error('Export PDF failed', err);
      const msg = err?.message || String(err) || 'Unknown error';
      // show clearer feedback to user for diagnosis
      try { toast.error(`PDF export failed: ${msg}`); } catch (e) { /* ignore toast errors */ }
      alert(`PDF export failed: ${msg}\nSee console for details.`);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMeds(setMeds)
      .catch((e) => toast.error(e?.message || "Failed to load medications"))
      .finally(() => setLoading(false));
  }, []);

  // read filter query param from dashboard links (e.g. ?filter=lowstock)
  const location = useLocation();
  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const f = qp.get("filter");
    if (f) setFilter(f);
    // open create dialog when route is /pharmacy/inventory/new or ?new=true
    if (location.pathname && location.pathname.endsWith("/new")) setShowCreate(true);
    if (qp.get("new") === "true") setShowCreate(true);
  }, [location.search]);

  const stats = useMemo(() => {
    let lowStock = 0;
    let batches = 0;
    meds.forEach((m) => {
      const totalQty =
        m.totalQuantity ??
        (Array.isArray(m.batches)
          ? m.batches.reduce((s, b) => s + (b.quantity || 0), 0)
          : 0);
      if (totalQty <= 10) lowStock += 1;
      batches += Array.isArray(m.batches) ? m.batches.length : 0;
    });
    return { total: meds.length, lowStock, batches };
  }, [meds]);

  const filteredMeds = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    return meds.filter((m) => {
      if (filter === "lowstock") {
        const totalQty = m.totalQuantity ?? (Array.isArray(m.batches) ? m.batches.reduce((s, b) => s + (b.quantity || 0), 0) : 0);
        if (totalQty > 10) return false;
      }
      if (filter === "batches") {
        const hasBatches = Array.isArray(m.batches) && m.batches.length > 0;
        if (!hasBatches) return false;
      }
      if (!q) return true;
      if ((m.name || "").toLowerCase().includes(q)) return true;
      if ((m.brandName || "").toLowerCase().includes(q)) return true;
      if ((m.strength || "").toLowerCase().includes(q)) return true;
      return false;
    });
  }, [meds, search, filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get("name"),
      brandName: fd.get("brandName"),
      strength: fd.get("strength"),
    };
    try {
      await pharmacyApiFetch("/medication-inventory", { method: "POST", body: JSON.stringify(payload) });
      await fetchMeds(setMeds);
      setShowCreate(false);
      toast.success("Medication created");
    } catch (err) {
      toast.error(err?.message || "Failed to create medication");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete medication?")) return;
    try {
      await pharmacyApiFetch(`/medication-inventory/${id}`, { method: "DELETE" });
      setMeds((prev) => prev.filter((x) => x._id !== id));
      toast.success("Medication deleted");
    } catch (err) {
      toast.error(err?.message || "Failed to delete");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get("name"),
      brandName: fd.get("brandName"),
      strength: fd.get("strength"),
      form: fd.get("form"),
      category: fd.get("category"),
      description: fd.get("description"),
      unit: fd.get("unit"),
    };
    try {
      const res = await pharmacyApiFetch(`/medication-inventory/${editing._id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setMeds((prev) => prev.map((m) => (m._id === res._id ? res : m)));
      setEditing(null);
      toast.success("Medication updated");
    } catch (err) {
      toast.error(err?.message || "Failed to update medication");
    }
  };

  const handleBatchUpdate = async (medId, batchId, row) => {
    const payload = {
      batchNo: row.querySelector('[data-field="batchNo"]').value,
      expiryDate: row.querySelector('[data-field="expiryDate"]').value,
      quantity: Number(row.querySelector('[data-field="quantity"]').value || 0),
      unitPrice: Number(row.querySelector('[data-field="unitPrice"]').value || 0),
    };
    // Validate expiry date is in the future
    try {
      const expiry = new Date(payload.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiry.setHours(0, 0, 0, 0);
      if (!(expiry > today)) {
        toast.error('Expiry date must be in the future');
        return;
      }
    } catch (e) {
      toast.error('Invalid expiry date');
      return;
    }
    try {
      const updated = await pharmacyApiFetch(
        `/medication-inventory/${medId}/batches/${batchId}`,
        { method: "PUT", body: JSON.stringify(payload) }
      );
      setEditing(updated);
      setMeds((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      toast.success("Batch updated");
    } catch (err) {
      toast.error(err?.message || "Failed to update batch");
    }
  };

  const handleBatchDelete = async (medId, batchId) => {
    if (!confirm("Delete batch?")) return;
    try {
      const updated = await pharmacyApiFetch(
        `/medication-inventory/${medId}/batches/${batchId}`,
        { method: "DELETE" }
      );
      setEditing(updated);
      setMeds((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      toast.success("Batch deleted");
    } catch (err) {
      toast.error(err?.message || "Failed to delete batch");
    }
  };

  const handleBatchAdd = async () => {
    const batchNo = document.getElementById("new_batchNo").value;
    const expiryDate = document.getElementById("new_expiryDate").value;
    const quantity = Number(document.getElementById("new_quantity").value || 0);
    const unitPrice = Number(document.getElementById("new_unitPrice").value || 0);

    if (!batchNo || !expiryDate || quantity === 0) {
      toast.error("batchNo, expiryDate, and quantity are required");
      return;
    }
    // Validate expiry date is in the future
    try {
      const expiry = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiry.setHours(0, 0, 0, 0);
      if (!(expiry > today)) {
        toast.error('Expiry date must be in the future');
        return;
      }
    } catch (e) {
      toast.error('Invalid expiry date');
      return;
    }
    try {
      const updated = await pharmacyApiFetch(
        `/medication-inventory/${editing._id}/batches`,
        { method: "POST", body: JSON.stringify({ batchNo, expiryDate, quantity, unitPrice, addedAt: new Date().toISOString() }) }
      );
      setEditing(updated);
      setMeds((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      ["new_batchNo", "new_expiryDate", "new_quantity", "new_unitPrice"].forEach(
        (id) => (document.getElementById(id).value = "")
      );
      toast.success("Batch added");
    } catch (err) {
      toast.error(err?.message || "Failed to add batch");
    }
  };

  return (
    <div className="space-y-8 p-1 md:p-2">
      {/* Header */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Pill className="h-3.5 w-3.5" />
              Medication Inventory
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Medication Inventory</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Manage medications, view low-stock alerts, and add new items.
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
                  <p className="truncate text-base font-semibold">Pharmacy Inventory</p>
                  <p className="truncate text-sm text-muted-foreground">Overview of stock and batches</p>
                </div>
                <Badge variant="outline" className="rounded-full">Pharmacist</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats + Create button */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card
            className={`rounded-2xl border shadow-none cursor-pointer hover:shadow-md ${filter === 'all' ? 'ring-2 ring-primary/30' : ''}`}
            onClick={() => { setFilter('all'); setSearch(''); }}
          >
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Medications</p>
              <p className="mt-2 text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card
            className={`rounded-2xl border shadow-none cursor-pointer hover:shadow-md ${filter === 'lowstock' ? 'ring-2 ring-primary/30' : ''}`}
            onClick={() => { setFilter('lowstock'); setSearch(''); }}
          >
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Low stock (≤10)</p>
              <p className="mt-2 text-2xl font-bold">{stats.lowStock}</p>
            </CardContent>
          </Card>
          <Card
            className={`rounded-2xl border shadow-none cursor-pointer hover:shadow-md ${filter === 'batches' ? 'ring-2 ring-primary/30' : ''}`}
            onClick={() => { setFilter('batches'); setSearch(''); }}
          >
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total batches</p>
              <p className="mt-2 text-2xl font-bold">{stats.batches}</p>
            </CardContent>
          </Card>
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={exportInventoryPdf}>Export PDF</Button>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button>New Medication</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Medication</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-2">
                  <input name="name" placeholder="Name" className="w-full rounded border p-2" required />
                  <input name="brandName" placeholder="Brand" className="w-full rounded border p-2" />
                  <input name="strength" placeholder="Strength" className="w-full rounded border p-2" />
                  <DialogFooter className="mt-4">
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Search / Filter */}
        <div className="mt-4 flex items-center gap-3">
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search name, brand, strength..." className="w-full rounded-md border px-3 py-2" />
          <select value={filter} onChange={(e)=>setFilter(e.target.value)} className="rounded-md border px-3 py-2">
            <option value="all">All</option>
            <option value="lowstock">Low stock (≤10)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading medications...
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {filteredMeds.map((m) => {
              const totalQty = m.totalQuantity ?? (Array.isArray(m.batches) ? m.batches.reduce((s, b) => s + (b.quantity || 0), 0) : 0);
              const low = totalQty <= 10;
              return (
                <Card key={m._id}>
                  <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold truncate">{m.name || 'Medication'}</h3>
                      <p className="text-sm text-muted-foreground truncate">{m.brandName || '-' } • {m.strength || '-'}</p>

                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Total: {totalQty}</span>
                        <span>Avg: {getAverageUnitPrice(m.batches || []) || '-'}</span>
                        <Badge className={`${low ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{low ? 'Low' : 'OK'}</Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setBatchesMed(m)} className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(m)} className="flex items-center gap-2">
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(m._id)} className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Medication</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleUpdate}>
              <div className="space-y-2">
                {[
                  { name: "name", label: "Name", defaultValue: editing.name, required: true },
                  { name: "brandName", label: "Brand", defaultValue: editing.brandName },
                  { name: "strength", label: "Strength", defaultValue: editing.strength, required: true },
                  { name: "category", label: "Category", defaultValue: editing.category },
                  { name: "unit", label: "Unit", defaultValue: editing.unit },
                ].map(({ name, label, defaultValue, required }) => (
                  <div key={name}>
                    <label className="text-sm">{label}</label>
                    <input name={name} defaultValue={defaultValue} className="w-full rounded border p-2" required={!!required} />
                  </div>
                ))}
                <div>
                  <label className="text-sm">Form</label>
                  <select name="form" defaultValue={editing.form || "tablet"} className="w-full rounded border p-2">
                    {FORM_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm">Description</label>
                  <textarea name="description" defaultValue={editing.description} className="w-full rounded border p-2" />
                </div>
              </div>

              {/* Batches */}
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Batches</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium">
                    <div className="col-span-3">Batch No</div>
                    <div className="col-span-3">Expiry</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Unit Price</div>
                    <div className="col-span-2">Actions</div>
                  </div>

                  {(editing.batches || []).map((b) => (
                    <div key={b._id} className="grid grid-cols-12 gap-2 items-center" data-batchid={b._id}>
                      <input className="col-span-3 rounded border p-1 text-sm" defaultValue={b.batchNo} data-field="batchNo" placeholder="Batch No" />
                      <input type="date" className="col-span-3 rounded border p-1 text-sm" defaultValue={b.expiryDate ? new Date(b.expiryDate).toISOString().slice(0, 10) : ""} data-field="expiryDate" />
                      <input type="number" className="col-span-2 rounded border p-1 text-sm" defaultValue={b.quantity} data-field="quantity" />
                      <input type="number" className="col-span-2 rounded border p-1 text-sm" defaultValue={b.unitPrice ?? ""} data-field="unitPrice" />
                      <div className="col-span-2 flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            const row = e.currentTarget.closest("[data-batchid]");
                            handleBatchUpdate(editing._id, b._id, row);
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleBatchDelete(editing._id, b._id)}
                        >
                          Del
                        </Button>
                      </div>
                      {b.addedAt && (
                        <div className="col-span-12 text-xs text-muted-foreground">
                          Added: {formatDateTime(b.addedAt)}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* New batch row */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <input id="new_batchNo" placeholder="Batch No" className="col-span-3 rounded border p-1 text-sm" />
                    <input id="new_expiryDate" type="date" className="col-span-3 rounded border p-1 text-sm" />
                    <input id="new_quantity" type="number" placeholder="Qty" className="col-span-2 rounded border p-1 text-sm" />
                    <input id="new_unitPrice" type="number" placeholder="Price" className="col-span-2 rounded border p-1 text-sm" />
                    <div className="col-span-2">
                      <Button type="button" size="sm" onClick={handleBatchAdd}>Add</Button>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button type="submit">Save Medication</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* Batches viewer dialog */}
      <Dialog open={!!batchesMed} onOpenChange={(open) => { if (!open) setBatchesMed(null); }}>
        <DialogContent className="max-h-[80vh] overflow-auto w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle>Batches for {batchesMed?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-2">
            {(!batchesMed?.batches || batchesMed.batches.length === 0) ? (
              <p className="text-sm text-muted-foreground">No batches available for this medication.</p>
            ) : (
              <div className="space-y-2">
                {(batchesMed.batches || []).map((batch) => (
                  <div key={batch._id || batch.batchNo} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Batch: {batch.batchNo}</div>
                        <div className="text-xs text-muted-foreground">Expiry: {formatDateTime(batch.expiryDate)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">Qty: {batch.quantity || 0}</div>
                        <div className="text-xs text-muted-foreground">Unit: {batch.unitPrice ? formatNumber(batch.unitPrice) : '-'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setBatchesMed(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
