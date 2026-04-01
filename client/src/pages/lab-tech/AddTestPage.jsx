import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDiagnosticTest } from "@/services/lab-tech.service";
import { useLabTech } from "@/contexts/LabTechContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, AlertCircle, CheckCircle2, ArrowLeft, } from "lucide-react";
export default function AddTestPage() {
    const navigate = useNavigate();
    const { centerId } = useLabTech();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [instructions, setInstructions] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !instructions.trim()) {
            setError("Test name and preparation instructions are required.");
            return;
        }
        try {
            setSubmitting(true);
            setError("");
            await createDiagnosticTest({
                name: name.trim(),
                description: description.trim() || undefined,
                instructions: instructions.trim(),
                isActive,
                centerId: centerId || undefined,
            });
            setSuccess(true);
            setTimeout(() => navigate("/lab-tech/test-types"), 1500);
        }
        catch (err) {
            setError(err?.message || "Failed to create diagnostic test.");
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<div className="space-y-8 p-1 md:p-2">
      {/* Page header */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            <PlusCircle className="h-3.5 w-3.5"/>
            Add Diagnostic Test
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Add Diagnostic Test
            </h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Create a new diagnostic test type available for patient booking.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="rounded-3xl border shadow-sm">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {error && (<div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0"/>
                {error}
              </div>)}

            {success && (<div className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
                <CheckCircle2 className="h-4 w-4 shrink-0"/>
                Diagnostic test created successfully! Redirecting…
              </div>)}

            <div className="space-y-2">
              <Label htmlFor="name">
                Test Name <span className="text-destructive">*</span>
              </Label>
              <Input id="name" placeholder="e.g. Complete Blood Count (CBC)" value={name} onChange={(e) => setName(e.target.value)} required className="h-11 rounded-xl"/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Test Description</Label>
              <Textarea id="description" placeholder="Brief description of what this test measures…" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="resize-none rounded-xl"/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">
                Preparation Instructions{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea id="instructions" placeholder="e.g. Fast for 8 hours before the test. Avoid strenuous exercise 24 hours prior." value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} required className="resize-none rounded-xl"/>
            </div>

            <div className="flex items-center justify-between rounded-2xl border bg-muted/20 p-4">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-muted-foreground">
                  {isActive
            ? "Active — visible to patients for booking"
            : "Inactive — hidden from patient booking"}
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive}/>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate("/lab-tech/test-types")}>
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={submitting || success}>
                {submitting ? "Creating…" : "Create Test"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>);
}
