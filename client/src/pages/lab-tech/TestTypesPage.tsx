import { useEffect, useMemo, useState } from "react";
import {
  getDiagnosticTests,
  updateDiagnosticTest,
  type DiagnosticTest,
} from "@/services/lab-tech.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  AlertCircle,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function TestTypesPage() {
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<DiagnosticTest | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadTests();
  }, []);

  async function loadTests() {
    try {
      setLoading(true);
      setError("");
      const data = await getDiagnosticTests();
      setTests(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load diagnostic tests.");
    } finally {
      setLoading(false);
    }
  }

  function openEdit(test: DiagnosticTest) {
    setEditTarget(test);
    setEditName(test.name);
    setEditDescription(test.description || "");
    setEditInstructions(test.instructions || "");
    setEditIsActive(test.isActive);
    setSaveError("");
    setSaveSuccess(false);
  }

  function closeEdit() {
    setEditTarget(null);
    setSaveError("");
    setSaveSuccess(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (!editName.trim() || !editInstructions.trim()) {
      setSaveError("Test name and preparation instructions are required.");
      return;
    }
    try {
      setSaving(true);
      setSaveError("");
      const updated = await updateDiagnosticTest(editTarget._id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        instructions: editInstructions.trim(),
        isActive: editIsActive,
      });
      setTests((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      );
      setSaveSuccess(true);
      setTimeout(closeEdit, 1000);
    } catch (err: any) {
      setSaveError(err?.message || "Failed to update test.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(test: DiagnosticTest) {
    try {
      const updated = await updateDiagnosticTest(test._id, {
        isActive: !test.isActive,
      });
      setTests((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      );
    } catch (err: any) {
      setError(err?.message || "Failed to update status.");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return tests;
    return tests.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
    );
  }, [tests, search]);

  const activeCount = tests.filter((t) => t.isActive).length;

  return (
    <div className="space-y-8 p-1 md:p-2">
      {/* Header */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <FlaskConical className="h-3.5 w-3.5" />
              Diagnostic Test Management
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Test Types</h1>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Manage all diagnostic tests available for booking.
              </p>
            </div>
          </div>
          <Link to="/lab-tech/add-test">
            <Button className="rounded-xl shrink-0">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Test
            </Button>
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Tests", value: tests.length, color: "text-foreground" },
            { label: "Active", value: activeCount, color: "text-success" },
            { label: "Inactive", value: tests.length - activeCount, color: "text-muted-foreground" },
          ].map(({ label, value, color }) => (
            <Card key={label} className="rounded-2xl border shadow-none">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`mt-2 text-2xl font-bold ${color}`}>
                  {loading ? "--" : value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* List */}
      <Card className="rounded-3xl border shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">All Diagnostic Tests</h2>
              <p className="text-sm text-muted-foreground">
                {filtered.length} of {tests.length} tests
              </p>
            </div>
            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tests…"
                className="h-11 rounded-xl pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading tests…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <FlaskConical className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No diagnostic tests found</p>
              <Link to="/lab-tech/add-test">
                <Button variant="outline" size="sm" className="mt-4 rounded-xl">
                  Add your first test
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((test) => (
                <Card
                  key={test._id}
                  className="rounded-2xl border shadow-none transition-all duration-200 hover:shadow-sm"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                          <FlaskConical className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold">
                              {test.name}
                            </h3>
                            <Badge
                              variant="secondary"
                              className={`rounded-full border px-3 py-1 text-[11px] ${
                                test.isActive
                                  ? "border-success/20 bg-success/10 text-success"
                                  : "border-transparent bg-muted text-muted-foreground"
                              }`}
                            >
                              {test.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          {test.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {test.description}
                            </p>
                          )}
                          {test.instructions && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              <span className="font-medium">Prep:</span>{" "}
                              {test.instructions}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => openEdit(test)}
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`rounded-xl ${
                            test.isActive
                              ? "border-destructive/30 text-destructive hover:text-destructive"
                              : "border-success/30 text-success hover:text-success"
                          }`}
                          onClick={() => handleToggleActive(test)}
                        >
                          {test.isActive ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
            <DialogTitle className="text-xl">Edit Diagnostic Test</DialogTitle>
            <DialogDescription>
              Update test details. Changes are visible to patients immediately.
            </DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form
              onSubmit={handleSave}
              className="max-h-[80vh] overflow-y-auto px-6 pb-6"
            >
              <div className="space-y-5 py-4">
                {saveError && (
                  <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {saveError}
                  </div>
                )}
                {saveSuccess && (
                  <div className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Test updated successfully!
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="edit-name">
                    Test Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="resize-none rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-instructions">
                    Preparation Instructions{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="edit-instructions"
                    value={editInstructions}
                    onChange={(e) => setEditInstructions(e.target.value)}
                    required
                    rows={4}
                    className="resize-none rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border bg-muted/20 p-4">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-xs text-muted-foreground">
                      {editIsActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <Switch
                    checked={editIsActive}
                    onCheckedChange={setEditIsActive}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={closeEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl"
                    disabled={saving || saveSuccess}
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
