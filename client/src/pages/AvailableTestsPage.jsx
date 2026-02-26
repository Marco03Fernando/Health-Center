import { useEffect, useState } from "react";
import axios from "axios";

const emptyParam = { name: "", unit: "", normalMinValue: "", normalMaxValue: "" };

export default function AvailableTestsPage() {
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState(null);

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  /* ================= FETCH TESTS ================= */

  const fetchTests = async () => {
    try {
      const res = await axios.get("http://localhost:8070/api/test-types");
      setTests(res.data);
    } catch (err) {
      console.error("Failed to fetch tests", err);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  /* ================= OPEN MODAL ================= */

  const openViewModal = (test) => {
    setSelectedTest(test);
    setForm(test);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (test) => {
    setSelectedTest(test);
    setForm({
      ...test,
      parameters: test.parameters.map((p) => ({ ...p })),
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTest(null);
    setIsEditMode(false);
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;

    try {
      await axios.delete(`http://localhost:8070/api/test-types/${id}`);
      fetchTests();
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= UPDATE ================= */

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateParam = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      parameters: prev.parameters.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  };

  const addParameter = () =>
    setForm((prev) => ({
      ...prev,
      parameters: [...prev.parameters, { ...emptyParam }],
    }));

  const removeParameter = (index) =>
    setForm((prev) => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index),
    }));

  const handleUpdate = async () => {
    try {
      await axios.put(
        `http://localhost:8070/api/test-types/${selectedTest._id}`,
        form
      );
      fetchTests();
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= UI ================= */

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Available Tests
      </h1>

      {tests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No tests available.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((test) => (
            <div
              key={test._id}
              className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              onClick={() => openViewModal(test)}
            >
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  {test.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Code: {test.testCode}
                </p>
              </div>

              <div
                className="flex gap-2 mt-4"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => openEditModal(test)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(test._id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-destructive text-white hover:opacity-90"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL ================= */}

      {isModalOpen && form && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {isEditMode ? "Edit Test" : "Test Details"}
              </h2>
              <button onClick={closeModal}>✕</button>
            </div>

            {/* BASIC INFO */}
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Test Code
                </label>
                <input
                  disabled={!isEditMode}
                  value={form.testCode}
                  onChange={(e) => updateField("testCode", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Test Name
                </label>
                <input
                  disabled={!isEditMode}
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <textarea
                disabled={!isEditMode}
                value={form.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
                className={`${inputClass} resize-none mb-4`}
                rows={2}
              />
            </div>

            {/* NEW FIELDS */}
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Category
                </label>
                <input
                  disabled={!isEditMode}
                  value={form.category || ""}
                  onChange={(e) => updateField("category", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Price
                </label>
                <input
                  type="number"
                  disabled={!isEditMode}
                  value={form.price || ""}
                  onChange={(e) => updateField("price", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Sample Types
                </label>
                <input
                  disabled={!isEditMode}
                  value={form.sampleTypes || ""}
                  onChange={(e) => updateField("sampleTypes", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Instructions
                </label>
                <textarea
                  disabled={!isEditMode}
                  value={form.instructions || ""}
                  onChange={(e) => updateField("instructions", e.target.value)}
                  className={`${inputClass} resize-none mb-4`}
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled={!isEditMode}
                  checked={form.isActive}
                  onChange={(e) => updateField("isActive", e.target.checked)}
                  className="rounded border-border text-primary focus:ring-ring h-4 w-4"
                />
                <label className="text-sm text-foreground">Active</label>
              </div>
            </div>

            {/* PARAMETERS */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Parameters</h3>

              {form.parameters.map((param, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 gap-2 items-end"
                >
                  <input
                    disabled={!isEditMode}
                    value={param.name}
                    onChange={(e) =>
                      updateParam(index, "name", e.target.value)
                    }
                    className={inputClass}
                  />
                  <input
                    disabled={!isEditMode}
                    value={param.unit}
                    onChange={(e) =>
                      updateParam(index, "unit", e.target.value)
                    }
                    className={inputClass}
                  />
                  <input
                    type="number"
                    disabled={!isEditMode}
                    value={param.normalMinValue}
                    onChange={(e) =>
                      updateParam(index, "normalMinValue", e.target.value)
                    }
                    className={inputClass}
                  />
                  <input
                    type="number"
                    disabled={!isEditMode}
                    value={param.normalMaxValue}
                    onChange={(e) =>
                      updateParam(index, "normalMaxValue", e.target.value)
                    }
                    className={inputClass}
                  />

                  {isEditMode && (
                    <button
                      onClick={() => removeParameter(index)}
                      className="text-destructive text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              {isEditMode && (
                <button
                  onClick={addParameter}
                  className="mt-2 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground"
                >
                  + Add Parameter
                </button>
              )}
            </div>

            {isEditMode && (
              <button
                onClick={handleUpdate}
                className="mt-6 w-full px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:opacity-90"
              >
                Update Test
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}