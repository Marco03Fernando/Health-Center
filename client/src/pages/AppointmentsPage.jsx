import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { appointments as initialAppointments, patients, testTypes, doctors } from "../data/mockData";

const statusTabs = ["pending", "undergoing", "completed"];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  undergoing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};

const nextStatus = {
  pending: "undergoing",
  undergoing: "completed",
};

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [appointmentList, setAppointmentList] = useState(initialAppointments);
  const navigate = useNavigate();

  const filtered = appointmentList.filter((a) => a.status === activeTab);

  const getPatient = (id) => patients.find((p) => p._id === id);
  const getTestType = (id) => testTypes.find((t) => t._id === id);
  const getDoctor = (id) => doctors.find((d) => d._id === id);

  const changeStatus = (appointmentId) => {
    setAppointmentList((prev) =>
      prev.map((a) =>
        a._id === appointmentId && nextStatus[a.status]
          ? { ...a, status: nextStatus[a.status] }
          : a
      )
    );
  };

  const handleUpdateResults = (appointment) => {
    const patient = getPatient(appointment.patientId);
    const testType = getTestType(appointment.testTypeId);
    const doctor = getDoctor(appointment.doctorId);
    navigate("/update-results", { state: { appointment, patient, testType, doctor } });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Appointments</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-secondary rounded-lg p-1">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            <span className="ml-2 text-xs opacity-70">
              ({appointmentList.filter((a) => a.status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No {activeTab} appointments found.
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((appt) => {
            const patient = getPatient(appt.patientId);
            const test = getTestType(appt.testTypeId);
            return (
              <div
                key={appt._id}
                className="bg-card rounded-lg border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground truncate">{patient?.name}</h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColors[appt.status]}`}>
                      {appt.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">{test?.name}</span> &middot;{" "}
                    {new Date(appt.appointmentDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {nextStatus[appt.status] && (
                    <button
                      onClick={() => changeStatus(appt._id)}
                      className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      Mark {nextStatus[appt.status]}
                    </button>
                  )}
                  {appt.status === "completed" && (
                    <button
                      onClick={() => handleUpdateResults(appt)}
                      className="px-4 py-2 text-sm font-medium rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
                    >
                      Update Results
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
