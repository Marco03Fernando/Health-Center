import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FlaskConical,
  MapPin,
  Phone,
  Printer,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
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
import { apiFetch } from "@/lib/api";

type LabBookingStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";

type BookingDetail = {
  _id: string;
  appointmentStatus: LabBookingStatus;
  appointmentDate?: string;
  diagnosticTest?: {
    _id: string;
    name: string;
    description?: string;
    preparationInstructions?: string;
  } | null;
  healthCenter?: {
    _id: string;
    name: string;
    address?: string;
    phone?: string;
  } | null;
  slot?: {
    _id: string;
    slotDate?: string;
    startTime?: string;
    endTime?: string;
  } | null;
};

const statusBadgeMap: Record<
  LabBookingStatus,
  React.ComponentProps<typeof StatusBadge>["status"]
> = {
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const LabBookingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function loadBooking() {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const res = await apiFetch(`/appointment/${id}`);
      setBooking(res?.data || res || null);
    } catch (err: any) {
      setError(err.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  useEffect(() => {
    loadBooking();
  }, [id]);

  async function handleCancel() {
    if (!id) return;
    try {
      setCancelling(true);
      await apiFetch(`/updateappointment/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      await loadBooking();
      setShowCancel(false);
    } catch (err: any) {
      setError(err.message || "Failed to cancel booking");
      setShowCancel(false);
    } finally {
      setCancelling(false);
    }
  }

  const formattedDate = (() => {
    const rawDate = booking?.slot?.slotDate || booking?.appointmentDate;
    if (!rawDate) return "—";
    return new Date(rawDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-4 animate-fade-in">
        <button
          onClick={() => navigate("/user/lab-bookings")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Lab Bookings
        </button>
        <div className="text-center py-12 text-muted-foreground">
          {error || "Booking not found."}
        </div>
      </div>
    );
  }

  const statusIcon = {
    CONFIRMED: <CheckCircle2 className="w-5 h-5 text-info" />,
    COMPLETED: <CheckCircle2 className="w-5 h-5 text-success" />,
    CANCELLED: <XCircle className="w-5 h-5 text-destructive" />,
  }[booking.appointmentStatus];

  return (
    <>
      {/* ── print-only styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #booking-slip, #booking-slip * { visibility: visible; }
          #booking-slip { position: fixed; inset: 0; padding: 2rem; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="space-y-6 animate-fade-in">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between no-print">
          <button
            onClick={() => navigate("/user/lab-bookings")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Lab Bookings
          </button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" />
            Print Booking Slip
          </Button>
        </div>

        {/* ── Printable content ── */}
        <div id="booking-slip" ref={printRef}>

          {/* ── Hero: test name + status ── */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <FlaskConical className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                  {booking.diagnosticTest?.name || "Diagnostic Test"}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">Lab Booking</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              {statusIcon}
              <StatusBadge status={statusBadgeMap[booking.appointmentStatus] ?? "pending"} />
            </div>
          </div>

          {/* booking ID */}
          <div className="flex items-center gap-1.5 ml-14 mb-5">
            <Hash className="w-3 h-3 text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground/60 font-mono">{booking._id}</span>
          </div>

          <Separator />

          {/* ── Appointment details ── */}
          <div className="py-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Appointment Details
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8">

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Time Slot</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {booking.slot?.startTime && booking.slot?.endTime
                      ? `${booking.slot.startTime} — ${booking.slot.endTime}`
                      : booking.slot?.startTime || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Lab Center</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {booking.healthCenter?.name || "—"}
                  </p>
                  {booking.healthCenter?.address && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {booking.healthCenter.address}
                    </p>
                  )}
                </div>
              </div>

              {booking.healthCenter?.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {booking.healthCenter.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Test information ── */}
          {(booking.diagnosticTest?.description ||
            booking.diagnosticTest?.preparationInstructions) && (
            <>
              <Separator />
              <div className="py-5 space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Test Information
                </h2>

                {booking.diagnosticTest?.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">About this test</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {booking.diagnosticTest.description}
                    </p>
                  </div>
                )}

                {booking.diagnosticTest?.preparationInstructions && (
                  <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">
                        Preparation Instructions
                      </p>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {booking.diagnosticTest.preparationInstructions}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
        {/* ── end printable ── */}

        {/* ── Actions ── */}
        {booking.appointmentStatus === "CONFIRMED" && (
          <>
            <Separator className="no-print" />
            <div className="flex justify-end no-print">
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
                onClick={() => setShowCancel(true)}
              >
                Cancel Booking
              </Button>
            </div>
          </>
        )}

      </div>

      {/* ── Cancel dialog ── */}
      <AlertDialog open={showCancel} onOpenChange={setShowCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Cancel Lab Booking?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your lab booking will be permanently cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Cancel Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LabBookingDetailPage;
