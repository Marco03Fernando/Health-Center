import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function UpdateResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { appointment, patient, testType, doctor } = location.state || {};

  const [results, setResults] = useState(
    testType?.parameters?.map((p) => ({
      name: p.name,
      value: "",
      unit: p.unit,
      normalMinValue: p.normalMinValue,
      normalMaxValue: p.normalMaxValue,
    })) || []
  );
  const [condition, setCondition] = useState("normal");
  const [notes, setNotes] = useState("");
  const [recommendConsultation, setRecommendConsultation] = useState(false);

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No appointment data provided.</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
        >
          Back to Appointments
        </button>
      </div>
    );
  }

  const handleResultChange = (index, value) => {
    setResults((prev) => prev.map((r, i) => (i === index ? { ...r, value } : r)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const testResult = {
      appointmentId: appointment._id,
      testTypeId: testType._id,
      patientId: patient._id,
      doctorId: doctor?._id || appointment.doctorId,
      status: "completed",
      condition,
      results: results.map((r) => ({ ...r, value: parseFloat(r.value) || 0 })),
      notes,
      recommendConsultation,
    };
    console.log("Submitting Test Result:", testResult);
    alert("Test results submitted successfully! (Check console for data)");
    navigate("/");
  };

  return (
    <div>
      <button
        onClick={() => navigate("/")}
        className="text-sm text-primary hover:underline mb-4 inline-block"
      >
        ← Back to Appointments
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-6">Update Test Results</h1>

      {/* Patient & Test Info */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Patient</h3>
          <p className="font-semibold text-foreground">{patient?.name}</p>
          <p className="text-sm text-muted-foreground">{patient?.age}y, {patient?.gender} &middot; {patient?.contact}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Test</h3>
          <p className="font-semibold text-foreground">{testType?.name}</p>
          <p className="text-sm text-muted-foreground">{testType?.testCode} &middot; {testType?.category}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dynamic Parameters */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="font-semibold text-foreground mb-4">Test Parameters</h2>
          <div className="space-y-4">
            {results.map((param, index) => (
              <div key={index} className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {param.name}
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      step="any"
                      value={param.value}
                      onChange={(e) => handleResultChange(index, e.target.value)}
                      className="flex-1 rounded-l-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Enter value"
                      required
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 border-border bg-muted text-muted-foreground text-sm rounded-r-md">
                      {param.unit}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground pb-2">
                  Normal: {param.normalMinValue} – {param.normalMaxValue} {param.unit}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Fields */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-foreground mb-2">Assessment</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="normal">Normal</option>
              <option value="severe">Severe</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Additional notes..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={recommendConsultation}
              onChange={(e) => setRecommendConsultation(e.target.checked)}
              className="rounded border-border text-primary focus:ring-ring h-4 w-4"
            />
            <span className="text-sm text-foreground">Recommend Consultation</span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Submit Results
        </button>
      </form>
    </div>
  );
}
