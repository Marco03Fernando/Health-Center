import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllLabBookings, updateBookingStatus } from "@/services/lab-tech.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FlaskConical,
  Search,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

// ✅ STATUS FILTERS
const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Undergoing", value: "UNDERGOING" },
  { label: "Results Pending", value: "RESULT_PENDING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

// ✅ STATUS COLORS
const STATUS_STYLES = {
  PENDING: "bg-yellow-100 text-yellow-800",
  UNDERGOING: "bg-blue-100 text-blue-800",
  RESULT_PENDING: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

// ✅ STATUS FLOW
const STATUS_FLOW = [
  "PENDING",
  "UNDERGOING",
  "RESULT_PENDING",
  "COMPLETED",
];

function getNextStatus(current) {
  const index = STATUS_FLOW.indexOf(current);
  return STATUS_FLOW[index + 1] || null;
}

function formatDate(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function LabBookingsPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancelId, setCancelId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // ✅ FETCH ALL BOOKINGS (ADMIN STYLE)
  async function fetchBookings() {
    try {
      setLoading(true);
      setError("");

      const data = await getAllLabBookings();
      setBookings(data);
    } catch (err) {
      setError(err?.message || "Failed to load lab bookings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  // ✅ NEXT STATUS HANDLER
  async function handleNextStatus(id, currentStatus) {
    try {
      const next = getNextStatus(currentStatus);
      if (!next) return;

      await updateBookingStatus(id, next);
      await fetchBookings();
    } catch (err) {
      setError(err?.message || "Failed to update status.");
    }
  }

  // ✅ CANCEL
  async function handleCancel(id) {
    try {
      setCancelling(true);
      await updateBookingStatus(id, "CANCELLED");
      await fetchBookings();
      setCancelId(null);
    } catch (err) {
      setError(err?.message || "Failed to cancel booking.");
      setCancelId(null);
    } finally {
      setCancelling(false);
    }
  }

  // ✅ FILTERING
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const q = search.toLowerCase();

      const matchSearch =
        !q ||
        (b.diagnosticTest?.name || "").toLowerCase().includes(q) ||
        (b.user?.fullName || b.user?.name || "").toLowerCase().includes(q) ||
        (b.user?.email || "").toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "all" || b.appointmentStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [bookings, search, statusFilter]);

  // ✅ COUNTS
  const pendingCount = bookings.filter(b => b.appointmentStatus === "PENDING").length;
  const undergoingCount = bookings.filter(b => b.appointmentStatus === "UNDERGOING").length;
  const completedCount = bookings.filter(b => b.appointmentStatus === "COMPLETED").length;
  const cancelledCount = bookings.filter(b => b.appointmentStatus === "CANCELLED").length;

  return (
    <div className="space-y-8 p-1 md:p-2">

      {/* HEADER */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            <FlaskConical className="h-3.5 w-3.5" />
            Lab Booking Management
          </div>
          <h1 className="text-3xl font-bold">Lab Bookings</h1>
        </div>

        {/* STATS */}
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Pending", value: pendingCount },
            { label: "Undergoing", value: undergoingCount },
            { label: "Completed", value: completedCount },
            { label: "Cancelled", value: cancelledCount },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">
                  {loading ? "--" : value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FILTERS */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 md:flex-row justify-between">

            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map((f) => (
                <Button
                  key={f.value}
                  variant={statusFilter === f.value ? "default" : "outline"}
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>

          </div>
        </CardContent>
      </Card>

      {/* LIST */}
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <Card key={b._id}>
              <CardContent className="p-5 flex justify-between items-center">

                <div>
                  <h3>{b.diagnosticTest?.name}</h3>
                  <p>{b.user?.name}</p>
                  <p>{formatDate(b.appointmentDate)}</p>

                  <Badge className={STATUS_STYLES[b.appointmentStatus]}>
                    {b.appointmentStatus}
                  </Badge>
                </div>

                <div className="flex gap-2">

                  {/* NEXT STATUS */}
                  {getNextStatus(b.appointmentStatus) && b.appointmentStatus !== "CANCELLED" && (
                    <Button
                      onClick={() => handleNextStatus(b._id, b.appointmentStatus)}
                    >
                      {b.appointmentStatus === "PENDING" && "Start"}
                      {b.appointmentStatus === "UNDERGOING" && "Mark Result"}
                      {b.appointmentStatus === "RESULT_PENDING" && "Complete"}
                    </Button>
                  )}

                  {/* CANCEL */}
                  {b.appointmentStatus !== "COMPLETED" &&
                    b.appointmentStatus !== "CANCELLED" && (
                      <Button
                        variant="destructive"
                        onClick={() => setCancelId(b._id)}
                      >
                        Cancel
                      </Button>
                    )}
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CANCEL DIALOG */}
      <AlertDialog open={!!cancelId}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelId(null)}>
              No
            </AlertDialogCancel>

            <AlertDialogAction onClick={() => handleCancel(cancelId)}>
              Yes Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}