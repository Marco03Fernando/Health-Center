import { useEffect, useMemo, useState } from "react";
import { getTestTypes, updateDiagnosticTest, deleteTestType } from "@/services/lab-tech.service";
import { useLabTech } from "@/contexts/LabTechContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FlaskConical, Search, Loader2, Pencil, Trash2, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function TestTypesPage() {
  const { centerId } = useLabTech();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState(null);

  // edit states
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editSampleTypes, setEditSampleTypes] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  useEffect(() => {
    loadTests();
  }, [centerId]);

  async function loadTests() {
    setLoading(true);
    const data = await getTestTypes(centerId);
    setTests(data);
    setLoading(false);
  }

  function openEdit(test) {
    setEditTarget(test);
    setEditName(test.name);
    setEditDescription(test.description || "");
    setEditCategory(test.category || "");
    setEditPrice(test.price || "");
    setEditSampleTypes(test.sampleTypes || "");
    setEditInstructions(test.instructions || "");
    setEditIsActive(test.isActive);
  }

  function closeEdit() {
    setEditTarget(null);
  }

  async function handleSave(e) {
    e.preventDefault();

    const updated = await updateDiagnosticTest(editTarget._id, {
      name: editName,
      description: editDescription,
      category: editCategory,
      price: Number(editPrice),
      sampleTypes: editSampleTypes,
      instructions: editInstructions,
      isActive: editIsActive,
    });

    setTests((prev) =>
      prev.map((t) => (t._id === updated._id ? updated : t))
    );

    closeEdit();
  }

  async function handleDelete(test) {
    if (!window.confirm("Delete this test?")) return;

    await deleteTestType(test._id);
    setTests((prev) => prev.filter((t) => t._id !== test._id));
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tests.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
    );
  }, [tests, search]);

  const activeTests = filtered.filter((t) => t.isActive);
  const inactiveTests = filtered.filter((t) => !t.isActive);

  return (
    <div className="space-y-8 p-1 md:p-2">

      {/* HEADER */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <FlaskConical className="h-3.5 w-3.5" />
              Diagnostic Test Management
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Test Types</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage all diagnostic tests available for booking.
              </p>
            </div>
          </div>

          <Link to="/lab-tech/add-test">
            <Button className="rounded-xl">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Test
            </Button>
          </Link>
        </div>

        {/* COUNTERS */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Tests", value: tests.length },
            { label: "Active", value: activeTests.length },
            { label: "Inactive", value: inactiveTests.length },
          ].map((item) => (
            <Card key={item.label} className="rounded-2xl border shadow-none">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-bold">
                  {loading ? "--" : item.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {filtered.length} of {tests.length} tests
        </h2>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10 rounded-xl"
            placeholder="Search tests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* ACTIVE */}
          <div>
            <h3 className="mb-2 font-semibold">Active Tests</h3>
            <div className="space-y-3">
              {activeTests.map((test) => (
                <TestCard key={test._id} test={test} openEdit={openEdit} handleDelete={handleDelete} />
              ))}
            </div>
          </div>

          {/* INACTIVE */}
          <div>
            <h3 className="mb-2 font-semibold">Inactive Tests</h3>
            <div className="space-y-3">
              {inactiveTests.map((test) => (
                <TestCard key={test._id} test={test} openEdit={openEdit} handleDelete={handleDelete} />
              ))}
            </div>
          </div>

        </div>
      )}

      {/* EDIT MODAL */}
      <Dialog open={!!editTarget} onOpenChange={closeEdit}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Test</DialogTitle>
            <DialogDescription>Update test details</DialogDescription>
          </DialogHeader>

          {editTarget && (
            <form onSubmit={handleSave} className="space-y-3">
              <Input value={editName} onChange={(e)=>setEditName(e.target.value)} />
              <Textarea value={editDescription} onChange={(e)=>setEditDescription(e.target.value)} />
              <Input value={editCategory} onChange={(e)=>setEditCategory(e.target.value)} />
              <Input value={editPrice} onChange={(e)=>setEditPrice(e.target.value)} />
              <Input value={editSampleTypes} onChange={(e)=>setEditSampleTypes(e.target.value)} />
              <Textarea value={editInstructions} onChange={(e)=>setEditInstructions(e.target.value)} />

              <div className="flex justify-between">
                <span>Status</span>
                <Switch checked={editIsActive} onCheckedChange={setEditIsActive}/>
              </div>

              <Button type="submit">Save</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// CARD
function TestCard({ test, openEdit, handleDelete }) {
  return (
    <Card className="rounded-2xl border shadow-none hover:shadow-sm">
      <CardContent className="p-5 flex justify-between">

        <div>
          <h3 className="font-semibold">{test.name}</h3>
          <p className="text-sm text-muted-foreground">{test.description}</p>
          <p className="text-xs text-muted-foreground">Category: {test.category}</p>
          <p className="text-xs text-muted-foreground">Sample: {test.sampleTypes}</p>

          <Badge className={test.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
            {test.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={()=>openEdit(test)}>
            <Pencil size={14}/>
          </Button>
          <Button size="sm" onClick={()=>handleDelete(test)}>
            <Trash2 size={14}/>
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}