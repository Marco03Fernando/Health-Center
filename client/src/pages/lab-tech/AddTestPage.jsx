import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTestType } from "@/services/lab-tech.service";
import { useLabTech } from "@/contexts/LabTechContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, AlertCircle, CheckCircle2, ArrowLeft, Trash2 } from "lucide-react";

export default function AddTestPage() {
  const navigate = useNavigate();
  const { centerId } = useLabTech();

  const [testCode, setTestCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [sampleTypes, setSampleTypes] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [parameters, setParameters] = useState([
    { name: "", unit: "", normalMinValue: "", normalMaxValue: "" }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleParameterChange = (index, field, value) => {
    const updated = [...parameters];
    updated[index][field] = value;
    setParameters(updated);
  };

  const addParameter = () => {
    setParameters([...parameters, { name: "", unit: "", normalMinValue: "", normalMaxValue: "" }]);
  };

  const removeParameter = (index) => {
    const updated = parameters.filter((_, i) => i !== index);
    setParameters(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validations
    if (!name.trim() || !instructions.trim()) {
      setError("Test name and preparation instructions are required.");
      return;
    }
    if (!parameters.length || !parameters.some(p => p.name.trim())) {
      setError("At least one parameter with a name is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      // Send the raw object
      await createTestType ({
        testCode: testCode.trim().toUpperCase(), // match your schema uppercase
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        price: Number(price) || 0,
        sampleTypes: sampleTypes.trim() || undefined,
        instructions: instructions.trim(),
        isActive,
        parameters: parameters.map(p => ({
          name: p.name.trim(),
          unit: p.unit.trim(),
          normalMinValue: Number(p.normalMinValue) || 0,
          normalMaxValue: Number(p.normalMaxValue) || 0,
        })),
        centerId: centerId || undefined,
      });

      setSuccess(true);
      setTimeout(() => navigate("/lab-tech/test-types"), 1500);

    } catch (err) {
      console.error("Error creating test:", err);
      setError(err?.message || "Failed to create diagnostic test.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-1 md:p-2 w-full">
      {/* Page header */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            <PlusCircle className="h-3.5 w-3.5" />
            Add Diagnostic Test
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Diagnostic Test</h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Create a new diagnostic test type available for patient booking.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="rounded-3xl border shadow-sm">
        <CardContent className="p-6 md:p-8 w-full">
          <form onSubmit={handleSubmit} className="space-y-6 w-full">
            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Diagnostic test created successfully! Redirecting…
              </div>
            )}

            {/* Test Code & Name in one row */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6 space-y-2">
                <Label htmlFor="testCode">Test Code</Label>
                <Input
                  id="testCode"
                  placeholder="e.g. LPT001"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="col-span-6 space-y-2">
                <Label htmlFor="name">
                  Test Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Lipid Profile Test"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {/* Description & Category in one row */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6 space-y-2">
                <Label htmlFor="description">Test Description</Label>
                <Textarea
                  id="description"
                  placeholder="Measures cholesterol and triglyceride levels."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="resize-none rounded-xl"
                />
              </div>
              <div className="col-span-6 space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g. Biochemistry"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {/* Price & Sample Types in one row */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6 space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g. 2500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="col-span-6 space-y-2">
                <Label htmlFor="sampleTypes">Sample Types</Label>
                <Input
                  id="sampleTypes"
                  placeholder="e.g. Blood"
                  value={sampleTypes}
                  onChange={(e) => setSampleTypes(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions">
                Preparation Instructions <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="instructions"
                placeholder="Fasting for 9-12 hours required."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                required
                className="resize-none rounded-xl"
              />
            </div>

            {/* Parameters Section */}
            <div className="space-y-4">
              <Label>Parameters</Label>
              {parameters.map((param, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <Input
                      placeholder="Parameter Name e.g. Total Cholesterol"
                      value={param.name}
                      onChange={(e) => handleParameterChange(index, "name", e.target.value)}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      placeholder="Unit e.g. mg/dL"
                      value={param.unit}
                      onChange={(e) => handleParameterChange(index, "unit", e.target.value)}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="Min Value"
                      type="number"
                      value={param.normalMinValue}
                      onChange={(e) => handleParameterChange(index, "normalMinValue", e.target.value)}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="Max Value"
                      type="number"
                      value={param.normalMaxValue}
                      onChange={(e) => handleParameterChange(index, "normalMaxValue", e.target.value)}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="col-span-2">
                    <Button
                      type="button"
                      variant="destructive"
                      className="rounded-xl w-full"
                      onClick={() => removeParameter(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="rounded-xl mt-2"
                onClick={addParameter}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Parameter
              </Button>
            </div>

            {/* Status Switch */}
            <div className="flex items-center justify-between rounded-2xl border bg-muted/20 p-4">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-muted-foreground">
                  {isActive
                    ? "Active — visible to patients for booking"
                    : "Inactive — hidden from patient booking"}
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => navigate("/lab-tech/test-types")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={submitting || success}>
                {submitting ? "Creating…" : "Create Test"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}