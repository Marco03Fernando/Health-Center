import { useState, useEffect } from "react";

const statusTabs = ["pending", "undergoing", "completed"];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 px-2 py-1 rounded",
  undergoing: "bg-blue-100 text-blue-800 px-2 py-1 rounded",
  completed: "bg-green-100 text-green-800 px-2 py-1 rounded",
};

// Map backend appointmentStatus to frontend tab category
const mapStatus = (status) => {
  switch (status) {
    case "PENDING":
    case "CONFIRMED":
      return "pending";
    case "UNDERGOING":
    case "RESULT_PENDING":
      return "undergoing";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
      return "completed"; // treat cancelled like completed for display
    default:
      return "pending";
  }
};

// Define next possible action for a given rawStatus
const nextAction = {
  PENDING: { label: "Start Test", newStatus: "UNDERGOING", color: "bg-blue-500" },
  CONFIRMED: { label: "Start Test", newStatus: "UNDERGOING", color: "bg-blue-500" },
  UNDERGOING: { label: "Send to Results", newStatus: "RESULT_PENDING", color: "bg-purple-500" },
  RESULT_PENDING: { label: "Complete", newStatus: "COMPLETED", color: "bg-green-500" },
};

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [appointmentList, setAppointmentList] = useState([]);

  const fetchAppointments = async () => {
    try {
      const res = await fetch("http://localhost:8070/api/getallappointments");
      const data = await res.json();
      if (data.success) {
        const mapped = data.data.map((item) => ({
          _id: item._id,
          rawStatus: item.appointmentStatus,
          status: mapStatus(item.appointmentStatus),
          doctorName: "Lab Test",
          centerName: item.centerId || "N/A",
          appointmentDate: item.createdAt,
        }));
        setAppointmentList(mapped);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const changeStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:8070/api/update-status/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAppointments();
      } else {
        alert("Failed to update");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    }
  };

  const filtered = appointmentList.filter((a) => a.status === activeTab);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Appointments</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab ? "bg-black text-white" : "bg-gray-200"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} (
            {appointmentList.filter((a) => a.status === tab).length})
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 && (
        <p className="text-gray-500">No appointments in this category</p>
      )}

      {filtered.map((appt) => (
        <div key={appt._id} className="border p-4 mb-4 rounded shadow">
          <h3 className="font-semibold text-lg">{appt.doctorName}</h3>
          <p className="text-gray-500 text-sm">{appt._id}</p>
          <p className="text-gray-500 text-sm">Center: {appt.centerName}</p>
          <p className="text-gray-500 text-sm">
            Date: {new Date(appt.appointmentDate).toLocaleString()}
          </p>

          <div className="mt-2">
            <span className={statusColors[appt.status]}>
              {appt.rawStatus.toLowerCase()}
            </span>
          </div>

          <div className="mt-4 flex gap-2">
            {nextAction[appt.rawStatus] && (
              <button
                onClick={() =>
                  changeStatus(appt._id, nextAction[appt.rawStatus].newStatus)
                }
                className={`${nextAction[appt.rawStatus].color} text-white px-3 py-1 rounded`}
              >
                {nextAction[appt.rawStatus].label}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}