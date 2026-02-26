import { useState } from "react";
import axios from "axios";

const emptyParam = { name: "", unit: "", normalMinValue: "", normalMaxValue: "" };

export default function AddTestPage() {
  const [form, setForm] = useState({
    testCode: "",
    name: "",
    description: "",
    category: "",
    price: "",
    sampleTypes: "",
    instructions: "",
    isActive: true,
  });

  const [parameters, setParameters] = useState([{ ...emptyParam }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateParam = (index, field, value) => {
    setParameters((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const addParameter = () =>
    setParameters((prev) => [...prev, { ...emptyParam }]);

  const removeParameter = (index) => {
    if (parameters.length === 1) return;
    setParameters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        testCode: form.testCode,
        name: form.name,
        description: form.description,
        category: form.category,
        price: parseFloat(form.price),
        sampleTypes: form.sampleTypes,
        instructions: form.instructions,
        isActive: form.isActive,
        parameters: parameters.map((p) => ({
          name: p.name,
          unit: p.unit,
          normalMinValue: parseFloat(p.normalMinValue),
          normalMaxValue: parseFloat(p.normalMaxValue),
        })),
      };

      await axios.post("http://localhost:8070/api/test-types", payload);

      alert("Diagnostic test added successfully!");

      setForm({
        testCode: "",
        name: "",
        description: "",
        category: "",
        price: "",
        sampleTypes: "",
        instructions: "",
        isActive: true,
      });

      setParameters([{ ...emptyParam }]);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          "Something went wrong while creating the test."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Add Diagnostic Test
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-foreground">
            Test Information
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Test Code
              </label>
              <input
                value={form.testCode}
                onChange={(e) => updateField("testCode", e.target.value)}
                className={inputClass}
                required
                placeholder="e.g. BS-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className={inputClass}
                required
                placeholder="e.g. Blood Sugar Test"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className={`${inputClass} resize-none`}
              rows={2}
              placeholder="Brief description of the test"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Category
              </label>
              <input
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={inputClass}
                required
                placeholder="e.g. Biochemistry"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Price
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
                className={inputClass}
                required
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Sample Types
              </label>
              <input
                value={form.sampleTypes}
                onChange={(e) => updateField("sampleTypes", e.target.value)}
                className={inputClass}
                placeholder="Blood, Urine"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Instructions
            </label>
            <textarea
              value={form.instructions}
              onChange={(e) => updateField("instructions", e.target.value)}
              className={`${inputClass} resize-none`}
              rows={2}
              placeholder="Patient preparation instructions"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
              className="rounded border-border text-primary focus:ring-ring h-4 w-4"
            />
            <span className="text-sm text-foreground">Active</span>
          </label>
        </div>

        {/* Parameters */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Parameters
            </h2>
            <button
              type="button"
              onClick={addParameter}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              + Add Parameter
            </button>
          </div>

          <div className="space-y-3">
            {parameters.map((param, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end"
              >
                <div>
                  {index === 0 && (
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Name
                    </label>
                  )}
                  <input
                    value={param.name}
                    onChange={(e) =>
                      updateParam(index, "name", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Parameter"
                    required
                  />
                </div>

                <div>
                  {index === 0 && (
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Unit
                    </label>
                  )}
                  <input
                    value={param.unit}
                    onChange={(e) =>
                      updateParam(index, "unit", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Unit"
                    required
                  />
                </div>

                <div>
                  {index === 0 && (
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Min
                    </label>
                  )}
                  <input
                    type="number"
                    step="any"
                    value={param.normalMinValue}
                    onChange={(e) =>
                      updateParam(index, "normalMinValue", e.target.value)
                    }
                    className={inputClass}
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  {index === 0 && (
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Max
                    </label>
                  )}
                  <input
                    type="number"
                    step="any"
                    value={param.normalMaxValue}
                    onChange={(e) =>
                      updateParam(index, "normalMaxValue", e.target.value)
                    }
                    className={inputClass}
                    placeholder="0"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeParameter(index)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Creating..." : "Add Test"}
        </button>
      </form>
    </div>
  );
}