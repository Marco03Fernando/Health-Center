import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, Search, Plus, Calendar, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { apiFetch } from "@/lib/api";
const STATUS_FILTERS = [
    { label: "All", value: "all" },
    { label: "Upcoming", value: "CONFIRMED" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
];
function mapBooking(b) {
    const test = b.diagnosticTest && typeof b.diagnosticTest === "object" ? b.diagnosticTest : null;
    const center = b.healthCenter && typeof b.healthCenter === "object" ? b.healthCenter : null;
    const slot = b.slot && typeof b.slot === "object" ? b.slot : null;
    const rawDate = slot?.slotDate || b.appointmentDate;
    const formattedDate = rawDate
        ? new Date(rawDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
        : "—";
    return {
        id: b._id || b.id || "",
        testName: test?.name || "Test not available",
        date: formattedDate,
        timeSlot: slot?.startTime && slot?.endTime
            ? `${slot.startTime} — ${slot.endTime}`
            : slot?.startTime || "—",
        labLocation: center?.name || "—",
        status: (b.appointmentStatus || "CONFIRMED"),
    };
}
const statusBadgeMap = {
    CONFIRMED: "confirmed",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
};
const LabBookingsPage = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [cancelId, setCancelId] = useState(null);
    async function loadBookings() {
        try {
            setLoading(true);
            setError("");
            const meRes = await apiFetch("/auth/me");
            const userId = meRes?.user?._id || meRes?.user?.id;
            if (!userId) {
                setError("Please log in first.");
                return;
            }
            const res = await apiFetch(`/user-appointments/${userId}`);
            const items = Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res)
                    ? res
                    : [];
            setBookings(items.map(mapBooking));
        }
        catch (err) {
            setError(err.message || "Failed to load lab bookings");
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        loadBookings();
    }, []);
    async function handleCancel(id) {
        try {
            await apiFetch(`/updateappointment/${id}`, {
                method: "PUT",
                body: JSON.stringify({ status: "CANCELLED" }),
            });
            setCancelId(null);
            await loadBookings();
        }
        catch (err) {
            setError(err.message || "Failed to cancel booking");
            setCancelId(null);
        }
    }
    const filtered = bookings.filter((b) => {
        const q = search.toLowerCase();
        const matchSearch = b.testName.toLowerCase().includes(q) ||
            b.labLocation.toLowerCase().includes(q);
        const matchStatus = statusFilter === "all" || b.status === statusFilter;
        return matchSearch && matchStatus;
    });
    return (<div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Lab Bookings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your diagnostic test bookings
          </p>
        </div>
        <Button onClick={() => navigate("/user/lab-bookings/new")} className="gap-2">
          <Plus className="w-4 h-4"/>
          Book New Test
        </Button>
      </div>

      {error ? <div className="text-sm text-destructive">{error}</div> : null}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
        <Input placeholder="Search by test name or lab location..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)}/>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (<Button key={f.value} variant={statusFilter === f.value ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(f.value)} className="shrink-0">
            {f.label}
          </Button>))}
      </div>

      {loading ? (<div className="text-center py-12 text-muted-foreground">
          Loading lab bookings...
        </div>) : filtered.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <FlaskConical className="w-16 h-16 text-muted-foreground/30 mb-4"/>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">
            No lab bookings found
          </h2>
          <p className="text-muted-foreground mb-4">
            Book a diagnostic test to get started
          </p>
          <Button onClick={() => navigate("/user/lab-bookings/new")}>
            Book New Test
          </Button>
        </div>) : (<div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((booking) => (<Card key={booking.id} className="animate-fade-in cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/user/lab-bookings/${booking.id}`)}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">
                      {booking.testName}
                    </h3>
                  </div>
                  <StatusBadge status={statusBadgeMap[booking.status] ?? "pending"}/>
                </div>

                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0"/>
                    {booking.labLocation}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 shrink-0"/>
                    {booking.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 shrink-0"/>
                    {booking.timeSlot}
                  </div>
                </div>

                <div className="flex items-center justify-end mt-4 pt-3 border-t border-border gap-2">
                  <Button variant="outline" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/user/lab-bookings/${booking.id}`);
                }}>
                    View Details
                  </Button>
                  {booking.status === "CONFIRMED" && (<Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={(e) => {
                        e.stopPropagation();
                        setCancelId(booking.id);
                    }}>
                      Cancel
                    </Button>)}
                </div>
              </CardContent>
            </Card>))}
        </div>)}

      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Cancel Lab Booking?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your lab booking will be cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => {
            if (cancelId)
                handleCancel(cancelId);
        }}>
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
};
export default LabBookingsPage;
