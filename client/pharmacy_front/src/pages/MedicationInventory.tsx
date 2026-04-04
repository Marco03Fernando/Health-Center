import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import Button from "@/components/ui/button";

type NewMed = { name: string; brandName?: string; strength?: string };

export default function MedicationInventory() {
  const [meds, setMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/medication-inventory");
        setMeds(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Medication Inventory</h1>
      <div className="mt-4 flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button>New Medication</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Medication</DialogTitle>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as HTMLFormElement & { name: HTMLInputElement; brandName: HTMLInputElement; strength: HTMLInputElement };
              const payload: NewMed = { name: target.name.value, brandName: target.brandName.value, strength: target.strength.value };
              try {
                await apiFetch('/medication-inventory', { method: 'POST', body: JSON.stringify(payload) });
                await (async () => { setLoading(true); try { const data = await apiFetch('/medication-inventory'); setMeds(data || []); } catch(e){console.error(e)} finally{setLoading(false)} })();
                // close by removing token? rely on portal close via default
              } catch (err) {
                alert((err as any).message || 'Failed');
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
      {loading ? (
        <div>Loading...</div>
      ) : (
        <Table className="mt-4">
          <TableHeader>
            <tr>
              <TableHead>Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Strength</TableHead>
              <TableHead>Full Quantity</TableHead>
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
                <TableCell>{(m.batches || []).length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
