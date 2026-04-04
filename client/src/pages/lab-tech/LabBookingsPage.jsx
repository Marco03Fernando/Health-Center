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
  Loader2,
  AlertTriangle,
} from "lucide-react";

// STATUS FILTERS
const STATUS_FILTERS = [
  { label: "Pending", value: "PENDING" },
  { label: "Undergoing", value: "UNDERGOING" },
  { label: "Results Pending", value: "RESULT_PENDING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

// STATUS COLORS
const STATUS_STYLES = {
  PENDING: "bg-yellow-100 text-yellow-800",
  UNDERGOING: "bg-blue-100 text-blue-800",
  RESULT_PENDING: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

// STATUS FLOW
const STATUS_FLOW = [
  "PENDING",
  "UNDERGOING",
  "RESULT_PENDING",
  "COMPLETED",
];

// NORMALIZE CONFIRMED → PENDING
const normalizeStatus = (status) => {
  if (status === "CONFIRMED") return "PENDING";
  return status;
};

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

  function handleAddResult(booking) {
    navigate(`/lab/test-results/new/${booking._id}`, {
      state: { booking },
    });
  }

  // FILTER
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const q = search.trim().toLowerCase();

      const patientName = (
        b?.user?.fullName ||
        b?.user?.name ||
        ""
      ).toLowerCase();

      const testName = (
        b?.diagnosticTest?.name ||
        ""
      ).toLowerCase();

      const appointmentId = (b?._id || "").toLowerCase();

      const matchSearch =
        !q ||
        patientName.includes(q) ||
        testName.includes(q) ||
        appointmentId.includes(q);

      const matchStatus =
        statusFilter === "all" ||
        normalizeStatus(b.appointmentStatus) === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [bookings, search, statusFilter]);

  // COUNTS
  const pendingCount = bookings.filter(
    (b) => normalizeStatus(b.appointmentStatus) === "PENDING"
  ).length;
  const undergoingCount = bookings.filter(
    (b) => normalizeStatus(b.appointmentStatus) === "UNDERGOING"
  ).length;
  const resultPendingCount = bookings.filter(
    (b) => normalizeStatus(b.appointmentStatus) === "RESULT_PENDING"
  ).length;
  const completedCount = bookings.filter(
    (b) => normalizeStatus(b.appointmentStatus) === "COMPLETED"
  ).length;
  const cancelledCount = bookings.filter(
    (b) => normalizeStatus(b.appointmentStatus) === "CANCELLED"
  ).length;

  return (
    <div className="space-y-8 p-2">
      {/* HEADER */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FlaskConical className="h-4 w-4" />
          Lab Booking Management
        </div>
        <h1 className="mt-2 text-3xl font-bold">Lab Bookings</h1>

        {/* COUNTERS */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: "Pending", value: pendingCount },
            { label: "Undergoing", value: undergoingCount },
            { label: "Results Pending", value: resultPendingCount },
            { label: "Completed", value: completedCount },
            { label: "Cancelled", value: cancelledCount },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FILTERS */}
      <Card>
        <CardContent className="space-y-4 p-5">
          {/* SEARCH + ALL */}
          <div className="flex gap-2">
            <Input
              placeholder="Search by patient, test, or appointment ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
          </div>

          {/* OTHER FILTERS BELOW */}
          <div className="flex flex-wrap gap-2">
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
        </CardContent>
      </Card>

      {/* LIST */}
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => {
            const status = normalizeStatus(b.appointmentStatus);

            return (
              <Card key={b._id}>
                <CardContent className="flex items-center justify-between p-5">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">
                      {b.user?.fullName || b.user?.name || "Patient"}
                    </h3>

                    <p className="text-sm font-medium text-muted-foreground">
                      {b.diagnosticTest?.name || "Diagnostic Test"}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Appointment ID: {b._id || "—"}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(b.appointmentDate)}</span>

                      <Badge className={`ml-2 ${STATUS_STYLES[status]}`}>
                        {status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* NEXT STATUS */}
                    {status === "PENDING" && (
                      <Button onClick={() => handleNextStatus(b._id, status)}>
                        Start
                      </Button>
                    )}

                    {status === "UNDERGOING" && (
                      <Button onClick={() => handleNextStatus(b._id, status)}>
                        Mark Results Pending
                      </Button>
                    )}

                    {/* RESULT_PENDING => ADD RESULTS */}
                    {status === "RESULT_PENDING" && (
                      <Button onClick={() => handleAddResult(b)}>
                        Add Results
                      </Button>
                    )}

                    {/* CANCEL */}
                    {status !== "COMPLETED" && status !== "CANCELLED" && (
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
            );
          })}
        </div>
      )}

      {/* CANCEL DIALOG */}
      <AlertDialog open={!!cancelId}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Booking?
            </AlertDialogTitle>
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