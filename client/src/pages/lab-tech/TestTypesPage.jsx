import { useEffect, useMemo, useState } from "react";
import { getTestTypes, updateDiagnosticTest, deleteTestType } from "@/services/lab-tech.service";
import { useLabTech } from "@/contexts/LabTechContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FlaskConical,
  Search,
  Loader2,
  Pencil,
  Trash2,
  PlusCircle,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function TestTypesPage() {
  const { centerId } = useLabTech();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  // edit states
  const [editTestCode, setEditTestCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editSampleTypes, setEditSampleTypes] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editParameters, setEditParameters] = useState([
    { name: "", unit: "", normalMinValue: "", normalMaxValue: "" },
  ]);

  useEffect(() => {
    loadTests();
  }, [centerId]);

  async function loadTests() {
    setLoading(true);
    const data = await getTestTypes(centerId);
    setTests(data);
    setLoading(false);
  }

  function openView(test) {
    setViewTarget(test);
  }

  function closeView() {
    setViewTarget(null);
  }

  function openEdit(test) {
    setEditTarget(test);
    setEditTestCode(test.testCode || "");
    setEditName(test.name || "");
    setEditDescription(test.description || "");
    setEditCategory(test.category || "");
    setEditPrice(test.price ?? "");
    setEditSampleTypes(test.sampleTypes || "");
    setEditInstructions(test.instructions || "");
    setEditIsActive(!!test.isActive);
    setEditParameters(
      test.parameters?.length
        ? test.parameters.map((p) => ({
            _id: p._id,
            name: p.name || "",
            unit: p.unit || "",
            normalMinValue: p.normalMinValue ?? "",
            normalMaxValue: p.normalMaxValue ?? "",
          }))
        : [{ name: "", unit: "", normalMinValue: "", normalMaxValue: "" }]
    );
  }

  function closeEdit() {
    setEditTarget(null);
  }

  function handleEditParameterChange(index, field, value) {
    const updated = [...editParameters];
    updated[index][field] = value;
    setEditParameters(updated);
  }

  function addEditParameter() {
    setEditParameters([
      ...editParameters,
      { name: "", unit: "", normalMinValue: "", normalMaxValue: "" },
    ]);
  }

  function removeEditParameter(index) {
    const updated = editParameters.filter((_, i) => i !== index);
    setEditParameters(
      updated.length
        ? updated
        : [{ name: "", unit: "", normalMinValue: "", normalMaxValue: "" }]
    );
  }

  async function handleSave(e) {
    e.preventDefault();

    const updated = await updateDiagnosticTest(editTarget._id, {
      testCode: editTestCode.trim().toUpperCase(),
      name: editName.trim(),
      description: editDescription.trim(),
      category: editCategory.trim(),
      price: Number(editPrice),
      sampleTypes: editSampleTypes.trim(),
      instructions: editInstructions.trim(),
      isActive: editIsActive,
      parameters: editParameters.map((p) => ({
        _id: p._id,
        name: p.name.trim(),
        unit: p.unit.trim(),
        normalMinValue: Number(p.normalMinValue),
        normalMaxValue: Number(p.normalMaxValue),
      })),
    });

    setTests((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    closeEdit();
  }

  async function handleDelete(test) {
    if (!window.confirm("Delete this test?")) return;

    await deleteTestType(test._id);
    setTests((prev) => prev.filter((t) => t._id !== test._id));
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return tests.filter((t) =>
      [
        t.name,
        t.testCode,
        t.description,
        t.category,
        t.sampleTypes,
        t.instructions,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
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
            placeholder="Search by name or test code..."
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
                <TestCard
                  key={test._id}
                  test={test}
                  openView={openView}
                  openEdit={openEdit}
                  handleDelete={handleDelete}
                />
              ))}
            </div>
          </div>

          {/* INACTIVE */}
          <div>
            <h3 className="mb-2 font-semibold">Inactive Tests</h3>
            <div className="space-y-3">
              {inactiveTests.map((test) => (
                <TestCard
                  key={test._id}
                  test={test}
                  openView={openView}
                  openEdit={openEdit}
                  handleDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      <Dialog open={!!viewTarget} onOpenChange={closeView}>
        <DialogContent className="rounded-2xl max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Test</DialogTitle>
            <DialogDescription>Complete test type details</DialogDescription>
          </DialogHeader>

          {viewTarget && (
            <div className="space-y-6">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6 space-y-2">
                  <Label>Test Code</Label>
                  <Input value={viewTarget.testCode || ""} readOnly />
                </div>
                <div className="col-span-6 space-y-2">
                  <Label>Test Name</Label>
                  <Input value={viewTarget.name || ""} readOnly />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6 space-y-2">
                  <Label>Description</Label>
                  <Textarea value={viewTarget.description || ""} readOnly rows={3} />
                </div>
                <div className="col-span-6 space-y-2">
                  <Label>Category</Label>
                  <Input value={viewTarget.category || ""} readOnly />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6 space-y-2">
                  <Label>Price</Label>
                  <Input value={viewTarget.price ?? ""} readOnly />
                </div>
                <div className="col-span-6 space-y-2">
                  <Label>Sample Types</Label>
                  <Input value={viewTarget.sampleTypes || ""} readOnly />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Instructions</Label>
                <Textarea value={viewTarget.instructions || ""} readOnly rows={4} />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div>
                  <Badge
                    className={
                      viewTarget.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {viewTarget.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Parameters</Label>
                {viewTarget.parameters?.length ? (
                  <div className="space-y-3">
                    {viewTarget.parameters.map((param, index) => (
                      <div
                        key={param._id || index}
                        className="grid grid-cols-12 gap-2 rounded-xl border p-3"
                      >
                        <div className="col-span-3">
                          <Label className="text-xs text-muted-foreground">Name</Label>
                          <Input value={param.name || ""} readOnly />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs text-muted-foreground">Unit</Label>
                          <Input value={param.unit || ""} readOnly />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs text-muted-foreground">Min Value</Label>
                          <Input value={param.normalMinValue ?? ""} readOnly />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs text-muted-foreground">Max Value</Label>
                          <Input value={param.normalMaxValue ?? ""} readOnly />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No parameters available.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={!!editTarget} onOpenChange={closeEdit}>
        <DialogContent className="rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Test</DialogTitle>
            <DialogDescription>Update all test details</DialogDescription>
          </DialogHeader>

          {editTarget && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6 space-y-2">
                  <Label htmlFor="editTestCode">Test Code</Label>
                  <Input
                    id="editTestCode"
                    value={editTestCode}
                    onChange={(e) => setEditTestCode(e.target.value)}
                    placeholder="e.g. LPT001"
                  />
                </div>
                <div className="col-span-6 space-y-2">
                  <Label htmlFor="editName">Test Name</Label>
                  <Input
                    id="editName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter test name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6 space-y-2">
                  <Label htmlFor="editDescription">Description</Label>
                  <Textarea
                    id="editDescription"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="col-span-6 space-y-2">
                  <Label htmlFor="editCategory">Category</Label>
                  <Input
                    id="editCategory"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="Enter category"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6 space-y-2">
                  <Label htmlFor="editPrice">Price</Label>
                  <Input
                    id="editPrice"
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="Enter price"
                  />
                </div>
                <div className="col-span-6 space-y-2">
                  <Label htmlFor="editSampleTypes">Sample Types</Label>
                  <Input
                    id="editSampleTypes"
                    value={editSampleTypes}
                    onChange={(e) => setEditSampleTypes(e.target.value)}
                    placeholder="e.g. Blood"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editInstructions">Instructions</Label>
                <Textarea
                  id="editInstructions"
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <Label>Parameters</Label>

                {editParameters.map((param, index) => (
                  <div
                    key={param._id || index}
                    className="grid grid-cols-12 gap-2 items-end rounded-xl border p-3"
                  >
                    <div className="col-span-3 space-y-2">
                      <Label className="text-xs">Parameter Name</Label>
                      <Input
                        value={param.name}
                        onChange={(e) =>
                          handleEditParameterChange(index, "name", e.target.value)
                        }
                        placeholder="Parameter name"
                      />
                    </div>

                    <div className="col-span-3 space-y-2">
                      <Label className="text-xs">Unit</Label>
                      <Input
                        value={param.unit}
                        onChange={(e) =>
                          handleEditParameterChange(index, "unit", e.target.value)
                        }
                        placeholder="Unit"
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs">Min Value</Label>
                      <Input
                        type="number"
                        value={param.normalMinValue}
                        onChange={(e) =>
                          handleEditParameterChange(index, "normalMinValue", e.target.value)
                        }
                        placeholder="Min"
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs">Max Value</Label>
                      <Input
                        type="number"
                        value={param.normalMaxValue}
                        onChange={(e) =>
                          handleEditParameterChange(index, "normalMaxValue", e.target.value)
                        }
                        placeholder="Max"
                      />
                    </div>

                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full"
                        onClick={() => removeEditParameter(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={addEditParameter}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Parameter
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 p-4">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-xs text-muted-foreground">
                    {editIsActive
                      ? "Active — visible to patients for booking"
                      : "Inactive — hidden from patient booking"}
                  </p>
                </div>
                <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={closeEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// CARD
function TestCard({ test, openView, openEdit, handleDelete }) {
  return (
    <Card className="rounded-2xl border shadow-none hover:shadow-sm">
      <CardContent className="p-5 flex justify-between gap-4">
        <div>
          <h3 className="font-semibold">
            {test.name}{" "}
            <span className="text-sm font-medium text-muted-foreground">
              ({test.testCode || "N/A"})
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">{test.description}</p>
          <p className="text-xs text-muted-foreground">Category: {test.category}</p>
          <p className="text-xs text-muted-foreground">Sample: {test.sampleTypes}</p>

          <Badge
            className={
              test.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }
          >
            {test.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="flex gap-2 items-start">
          <Button size="sm" variant="outline" onClick={() => openView(test)}>
            <Eye size={14} />
          </Button>
          <Button size="sm" onClick={() => openEdit(test)}>
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDelete(test)}>
            <Trash2 size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}