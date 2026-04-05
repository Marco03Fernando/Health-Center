import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import Button from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Loader2, Pill, ClipboardList, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

type NewMed = { name: string; brandName?: string; strength?: string };

export default function MedicationInventory() {
  const [meds, setMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/medication-inventory");
        setMeds(Array.isArray(data) ? data : data?.items || data?.data || []);
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || "Failed to load medications");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const total = meds.length;
    let lowStock = 0;
    let batches = 0;

    meds.forEach((m) => {
      const totalQty = m.totalQuantity ?? (Array.isArray(m.batches) ? m.batches.reduce((s: number, b: any) => s + (b.quantity || 0), 0) : 0);
      if (totalQty <= 10) lowStock += 1;
      batches += Array.isArray(m.batches) ? m.batches.length : 0;
    });

    return { total, lowStock, batches };
  }, [meds]);

  const formatDateTime = (iso?: string) => iso ? new Date(iso).toLocaleString() : '';
  const formatNumber = (v?: number) => typeof v === 'number' ? new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) : '';

  return (
    <div className="space-y-8 p-1 md:p-2">
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
              <p className="text-sm text-muted-foreground">Total Medications</p>
              <p className="mt-2 text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Low stock (≤10)</p>
              <p className="mt-2 text-2xl font-bold">{stats.lowStock}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total batches</p>
              <p className="mt-2 text-2xl font-bold">{stats.batches}</p>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end">
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button onClick={() => setShowCreate(true)}>New Medication</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[70vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Add Medication</DialogTitle>
                </DialogHeader>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const target = e.target as HTMLFormElement & { name: HTMLInputElement; brandName: HTMLInputElement; strength: HTMLInputElement };
                  const payload: NewMed = { name: target.name.value, brandName: target.brandName.value, strength: target.strength.value };
                  try {
                    await apiFetch('/medication-inventory', { method: 'POST', body: JSON.stringify(payload) });
                    setLoading(true);
                    try { const data = await apiFetch('/medication-inventory'); setMeds(Array.isArray(data) ? data : data?.items || data?.data || []); } catch(e){console.error(e)} finally{setLoading(false)}
                    setShowCreate(false);
                    toast.success('Medication created');
                  } catch (err: any) {
                    toast.error(err?.message || 'Failed to create medication');
                  }
                }}>
                  <div className="space-y-2">
                    <input name="name" placeholder="Name" className="w-full rounded border p-2" required />
                    <input name="brandName" placeholder="Brand" className="w-full rounded border p-2" />
                    <input name="strength" placeholder="Strength" className="w-full rounded border p-2" />
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading medications...
          </div>
        ) : (
          <Table className="mt-4">
            <TableHeader>
              <tr>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Strength</TableHead>
                <TableHead>Full Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Batches</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {meds.map((m) => (
                <TableRow key={m._id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.brandName}</TableCell>
                  <TableCell>{m.strength}</TableCell>
                  <TableCell>{m.totalQuantity ?? (m.batches || []).reduce((s: number, b: any) => s + (b?.quantity || 0), 0)}</TableCell>
                  <TableCell>
                    {(() => {
                      const batches = Array.isArray(m.batches) ? m.batches : [];
                      const totalQty = batches.reduce((s: number, b: any) => s + (b?.quantity || 0), 0);
                      if (totalQty > 0) {
                        const weighted = batches.reduce((sum: number, b: any) => sum + ((b?.unitPrice || 0) * (b?.quantity || 0)), 0);
                        return formatNumber(weighted / totalQty);
                      }
                      return batches[0]?.unitPrice ? formatNumber(batches[0].unitPrice) : '';
                    })()}
                  </TableCell>
                  <TableCell>{(m.batches || []).length}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setEditing(m)}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="destructive" onClick={async () => {
                        if (!confirm('Delete medication?')) return;
                        try {
                          await apiFetch(`/medication-inventory/${m._id}`, { method: 'DELETE' });
                          setMeds((prev) => prev.filter((x) => x._id !== m._id));
                          toast.success('Medication deleted');
                        } catch (err: any) {
                          console.error(err);
                          toast.error(err?.message || 'Failed to delete');
                        }
                      }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
          <DialogContent className="max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Medication</DialogTitle>
          </DialogHeader>
          {editing ? (
            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as HTMLFormElement & {
                name: HTMLInputElement; brandName: HTMLInputElement; strength: HTMLInputElement; form: HTMLSelectElement; category: HTMLInputElement; description: HTMLTextAreaElement; unit: HTMLInputElement;
              };

              const payload: any = {
                name: target.name.value,
                brandName: target.brandName.value,
                strength: target.strength.value,
                form: target.form.value,
                category: target.category.value,
                description: target.description.value,
                unit: target.unit.value,
              };

              try {
                const res = await apiFetch(`/medication-inventory/${editing._id}`, { method: 'PUT', body: JSON.stringify(payload) });
                // update local list
                setMeds((prev) => prev.map((m) => (m._id === res._id ? res : m)));
                toast.success('Medication updated');
                // close the edit dialog
                setEditing(null);
              } catch (err: any) {
                console.error(err);
                toast.error(err?.message || 'Failed to update medication');
              }
            }}>
              <div className="space-y-2">
                <label className="text-sm">Name</label>
                <input name="name" defaultValue={editing.name} className="w-full rounded border p-2" required />

                <label className="text-sm">Brand</label>
                <input name="brandName" defaultValue={editing.brandName} className="w-full rounded border p-2" />

                <label className="text-sm">Strength</label>
                <input name="strength" defaultValue={editing.strength} className="w-full rounded border p-2" required />

                <label className="text-sm">Form</label>
                <select name="form" defaultValue={editing.form || 'tablet'} className="w-full rounded border p-2">
                  <option value="tablet">tablet</option>
                  <option value="capsule">capsule</option>
                  <option value="syrup">syrup</option>
                  <option value="injection">injection</option>
                  <option value="cream">cream</option>
                  <option value="drops">drops</option>
                  <option value="other">other</option>
                </select>

                <label className="text-sm">Category</label>
                <input name="category" defaultValue={editing.category} className="w-full rounded border p-2" />

                <label className="text-sm">Unit</label>
                <input name="unit" defaultValue={editing.unit} className="w-full rounded border p-2" />

                <label className="text-sm">Description</label>
                <textarea name="description" defaultValue={editing.description} className="w-full rounded border p-2" />
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium">Batches</h4>
                <div className="space-y-2 mt-2">
                  {/* batch header row */}
                  <div className="grid grid-cols-12 gap-2 items-center text-xs text-muted-foreground font-medium">
                    <div className="col-span-3">Batch No</div>
                    <div className="col-span-3">Expiry</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-2">Unit Price</div>
                    <div className="col-span-2">Actions</div>
                  </div>
                  {(editing.batches || []).map((b: any) => (
                    <div key={b._id} className="grid grid-cols-12 gap-2 items-center" data-batchid={b._id}>
                      <input className="col-span-3 rounded border p-2" defaultValue={b.batchNo} data-field="batchNo" placeholder="Batch No" />
                      <input type="date" className="col-span-3 rounded border p-2" defaultValue={b.expiryDate ? new Date(b.expiryDate).toISOString().slice(0,10) : ''} data-field="expiryDate" />
                      <input type="number" className="col-span-2 rounded border p-2" defaultValue={b.quantity} data-field="quantity" placeholder="Qty" />
                      <input type="number" className="col-span-2 rounded border p-2" defaultValue={b.unitPrice ?? ''} data-field="unitPrice" placeholder="Unit Price" />
                      <div className="col-span-2 flex gap-2">
                        <Button variant="outline" onClick={async (e) => {
                          const row = (e.currentTarget as HTMLElement).closest('[data-batchid]') as HTMLElement | null;
                          if (!row) return;
                          const batchId = row.getAttribute('data-batchid') || b._id;
                          const batchNo = (row.querySelector('[data-field="batchNo"]') as HTMLInputElement).value;
                          const expiryDate = (row.querySelector('[data-field="expiryDate"]') as HTMLInputElement).value;
                          const quantity = Number((row.querySelector('[data-field="quantity"]') as HTMLInputElement).value || 0);
                          const unitPrice = Number((row.querySelector('[data-field="unitPrice"]') as HTMLInputElement).value || 0);
                          try {
                            const updated = await apiFetch(`/medication-inventory/${editing._id}/batches/${batchId}`, { method: 'PUT', body: JSON.stringify({ batchNo, expiryDate, quantity, unitPrice }) });
                            setEditing(updated);
                            setMeds((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
                            toast.success('Batch updated');
                          } catch (err: any) {
                            console.error(err);
                            toast.error(err?.message || 'Failed to update batch');
                          }
                        }}>Save</Button>
                        <Button variant="destructive" onClick={async () => {
                          if (!confirm('Delete batch?')) return;
                          try {
                            const updated = await apiFetch(`/medication-inventory/${editing._id}/batches/${b._id}`, { method: 'DELETE' });
                            setEditing(updated);
                            setMeds((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
                            toast.success('Batch deleted');
                          } catch (err: any) {
                            console.error(err);
                            toast.error(err?.message || 'Failed to delete batch');
                          }
                        }}>Delete</Button>
                      </div>
                      {b.addedAt ? (
                        <div className="col-span-12 text-xs text-muted-foreground">Added: {formatDateTime(b.addedAt)}</div>
                      ) : null}
                    </div>
                  ))}

                  {/* Add new batch row */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <input id="new_batchNo" placeholder="Batch No" className="col-span-3 rounded border p-2" />
                    <input id="new_expiryDate" type="date" className="col-span-3 rounded border p-2" />
                    <input id="new_quantity" type="number" className="col-span-2 rounded border p-2" />
                    <input id="new_unitPrice" type="number" className="col-span-2 rounded border p-2" />
                    <div className="col-span-2">
                      <Button onClick={async () => {
                        const batchNo = (document.getElementById('new_batchNo') as HTMLInputElement).value;
                        const expiryDate = (document.getElementById('new_expiryDate') as HTMLInputElement).value;
                        const quantity = Number((document.getElementById('new_quantity') as HTMLInputElement).value || 0);
                        const unitPrice = Number((document.getElementById('new_unitPrice') as HTMLInputElement).value || 0);
                        if (!batchNo || !expiryDate || quantity === 0) {
                          toast.error('batchNo, expiryDate and quantity are required');
                          return;
                        }

                        try {
                          const addedAt = new Date().toISOString();
                          const updated = await apiFetch(`/medication-inventory/${editing._id}/batches`, { method: 'POST', body: JSON.stringify({ batchNo, expiryDate, quantity, unitPrice, addedAt }) });
                          setEditing(updated);
                          setMeds((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
                          (document.getElementById('new_batchNo') as HTMLInputElement).value = '';
                          (document.getElementById('new_expiryDate') as HTMLInputElement).value = '';
                          (document.getElementById('new_quantity') as HTMLInputElement).value = '';
                          (document.getElementById('new_unitPrice') as HTMLInputElement).value = '';
                          toast.success('Batch added');
                        } catch (err: any) {
                          console.error(err);
                          toast.error(err?.message || 'Failed to add batch');
                        }
                      }}>Add</Button>
                    </div>
                    <div className="col-span-12 text-xs text-muted-foreground">New batches will record the current date/time automatically when added.</div>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button type="submit">Save Medication</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
