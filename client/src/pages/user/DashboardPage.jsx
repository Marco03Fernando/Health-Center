import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, FileText, ShoppingBag, Stethoscope, Clock, ChevronRight, } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
function getArrayFromResponse(data) {
    if (Array.isArray(data))
        return data;
    if (Array.isArray(data?.data))
        return data.data;
    if (Array.isArray(data?.items))
        return data.items;
    if (Array.isArray(data?.appointments))
        return data.appointments;
    if (Array.isArray(data?.prescriptions))
        return data.prescriptions;
    if (Array.isArray(data?.orders))
        return data.orders;
    return [];
}
function normalizeStatus(status) {
    const value = String(status || "").trim().toLowerCase();
    switch (value) {
        case "confirmed":
            return "confirmed";
        case "pending":
            return "pending";
        case "completed":
            return "completed";
        case "cancelled":
        case "canceled":
            return "cancelled";
        case "no_show":
        case "no-show":
        case "noshow":
            return "no_show";
        default:
            return "pending";
    }
}
function formatDate(value) {
    if (!value)
        return "Not available";
    const d = new Date(value);
    if (Number.isNaN(d.getTime()))
        return value;
    return d.toISOString().split("T")[0];
}
function formatTime(value) {
    if (!value)
        return "Not available";
    return value;
}
function buildAppointmentDateTime(date, time) {
    if (!date)
        return Number.MAX_SAFE_INTEGER;
    const safeTime = time && /^\d{2}:\d{2}/.test(time.trim()) ? `${time.trim()}:00` : "00:00:00";
    const dt = new Date(`${date}T${safeTime}`);
    const stamp = dt.getTime();
    return Number.isNaN(stamp) ? Number.MAX_SAFE_INTEGER : stamp;
}
function mapAppointment(a) {
    const doctor = typeof a.doctorId === "object" && a.doctorId !== null ? a.doctorId : null;
    const centerFromDoctor = doctor && typeof doctor.centerId === "object" && doctor.centerId !== null
        ? doctor.centerId
        : null;
    const center = typeof a.centerId === "object" && a.centerId !== null
        ? a.centerId
        : centerFromDoctor;
    const slot = typeof a.slotId === "object" && a.slotId !== null ? a.slotId : null;
    return {
        id: a._id || a.id || "",
        doctorName: doctor?.name || "Doctor not available",
        specialization: doctor?.specialization || "Not available",
        clinic: center?.name || doctor?.clinic || "Center not available",
        date: formatDate(slot?.date),
        time: formatTime(slot?.startTime),
        status: normalizeStatus(a.status),
        rawDate: slot?.date,
        rawTime: slot?.startTime,
    };
}
const DashboardPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                setError("");
                const meRes = await apiFetch("/auth/me");
                const me = meRes?.user || meRes?.data || meRes;
                const userId = me?._id || me?.id;
                setUser(me || null);
                if (!userId) {
                    setAppointments([]);
                    setPrescriptions([]);
                    setOrders([]);
                    setError("Please log in first.");
                    return;
                }
                const [appointmentsRes, prescriptionsRes, ordersRes] = await Promise.allSettled([
                    apiFetch(`/appointments/user/${userId}`),
                    apiFetch("/prescriptions"),
                    apiFetch("/pharmacy-orders"),
                ]);
                if (appointmentsRes.status === "fulfilled") {
                    const rawAppointments = getArrayFromResponse(appointmentsRes.value);
                    const mappedAppointments = rawAppointments
                        .map(mapAppointment)
                        .sort((a, b) => buildAppointmentDateTime(a.rawDate, a.rawTime) -
                        buildAppointmentDateTime(b.rawDate, b.rawTime));
                    setAppointments(mappedAppointments);
                }
                else {
                    setAppointments([]);
                }
                if (prescriptionsRes.status === "fulfilled") {
                    setPrescriptions(getArrayFromResponse(prescriptionsRes.value));
                }
                else {
                    setPrescriptions([]);
                }
                if (ordersRes.status === "fulfilled") {
                    setOrders(getArrayFromResponse(ordersRes.value));
                }
                else {
                    setOrders([]);
                }
            }
            catch (err) {
                setUser(null);
                setAppointments([]);
                setPrescriptions([]);
                setOrders([]);
                setError(err?.message || "Failed to load dashboard");
            }
            finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, []);
    const upcoming = useMemo(() => {
        return appointments.filter((a) => a.status === "confirmed" || a.status === "pending");
    }, [appointments]);
    const completed = useMemo(() => {
        return appointments.filter((a) => a.status === "completed");
    }, [appointments]);
    const recentAppointments = useMemo(() => {
        return [...appointments]
            .sort((a, b) => buildAppointmentDateTime(b.rawDate, b.rawTime) -
            buildAppointmentDateTime(a.rawDate, a.rawTime))
            .slice(0, 3);
    }, [appointments]);
    const nextApt = upcoming[0];
    const firstName = user?.fullName?.split(" ")[0] || user?.name?.split(" ")[0] || "User";
    const stats = [
        {
            label: "Upcoming",
            value: upcoming.length,
            icon: CalendarCheck,
            color: "text-info",
        },
        {
            label: "Completed",
            value: completed.length,
            icon: Clock,
            color: "text-success",
        },
        {
            label: "Prescriptions",
            value: prescriptions.length,
            icon: FileText,
            color: "text-primary",
        },
        {
            label: "Orders",
            value: orders.length,
            icon: ShoppingBag,
            color: "text-warning",
        },
    ];
    const quickActions = [
        { label: "Book Appointment", icon: Stethoscope, to: "user/ConsultationPage" },
        { label: "View Appointments", icon: CalendarCheck, to: "user/AppointmentsPage.jsx" },
        { label: "Prescriptions", icon: FileText, to: "user/PrescriptionsPage" },
        { label: "Shop Medicines", icon: ShoppingBag, to: "user/MarketplacePage" },
    ];
    if (loading) {
        return (<div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Loading dashboard...
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Please wait a moment
          </p>
        </div>
      </div>);
    }
    return (<div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Welcome, {firstName} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's your health overview
        </p>
      </div>

      {error ? <div className="text-sm text-red-500">{error}</div> : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (<Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-accent flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5"/>
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground">
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>))}
      </div>

      <div>
        <h2 className="font-display font-semibold text-foreground mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a) => (<Button key={a.label} variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate(a.to)}>
              <a.icon className="w-5 h-5 text-primary"/>
              <span className="text-xs">{a.label}</span>
            </Button>))}
        </div>
      </div>

      {nextApt ? (<div>
          <h2 className="font-display font-semibold text-foreground mb-3">
            Next Appointment
          </h2>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/user/appointments")}>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-xl">
                  🩺
                </div>
                <div>
                  <h3 className="font-medium text-foreground">
                    {nextApt.doctorName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {nextApt.date} · {nextApt.time}
                  </p>
                  <StatusBadge status={nextApt.status}/>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground"/>
            </CardContent>
          </Card>
        </div>) : null}

      <div>
        <h2 className="font-display font-semibold text-foreground mb-3">
          Recent Activity
        </h2>
        <div className="space-y-2">
          {recentAppointments.length === 0 ? (<Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                No recent activity yet.
              </CardContent>
            </Card>) : (recentAppointments.map((a) => (<Card key={a.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {a.doctorName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.date} · {a.time}
                    </p>
                  </div>
                  <StatusBadge status={a.status}/>
                </CardContent>
              </Card>)))}
        </div>
      </div>
    </div>);
};
export default DashboardPage;
