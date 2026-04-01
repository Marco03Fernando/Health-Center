import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getBookingById, updateBookingStatus, } from "@/services/lab-tech.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { ArrowLeft, FlaskConical, Calendar, Clock, MapPin, User, Mail, Phone, AlertTriangle, Loader2, FileText, ClipboardEdit, AlertCircle, } from "lucide-react";
const BOOKING_STATUS_STYLES = {
    CONFIRMED: "bg-info/10 text-info border-info/20",
    COMPLETED: "bg-success/10 text-success border-success/20",
    CANCELLED: "bg-muted text-muted-foreground border-transparent",
};
function formatDate(raw) {
    if (!raw)
        return "—";
    return new Date(raw).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}
function DetailRow({ icon: Icon, label, value, }) {
    if (!value)
        return null;
    return (<div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/50">
        <Icon className="h-4 w-4 text-muted-foreground"/>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium">{value}</p>
      </div>
    </div>);
}
export default function LabTechBookingDetailPage() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    useEffect(() => {
        if (!bookingId)
            return;
        (async () => {
            try {
                setLoading(true);
                setError("");
                const data = await getBookingById(bookingId);
                setBooking(data);
            }
            catch (err) {
                setError(err?.message || "Failed to load booking details.");
            }
            finally {
                setLoading(false);
            }
        })();
    }, [bookingId]);
    async function handleCancel() {
        if (!booking)
            return;
        try {
            setCancelling(true);
            await updateBookingStatus(booking._id, "CANCELLED");
            setBooking((prev) => prev ? { ...prev, appointmentStatus: "CANCELLED" } : null);
            setConfirmCancel(false);
        }
        catch (err) {
            setError(err?.message || "Failed to cancel booking.");
            setConfirmCancel(false);
        }
        finally {
            setCancelling(false);
        }
    }
    if (loading) {
        return (<div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
      </div>);
    }
    if (error || !booking) {
        return (<div className="space-y-4 p-1 md:p-2">
        <Button variant="ghost" className="rounded-xl" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4"/>
          Back
        </Button>
        <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0"/>
          {error || "Booking not found."}
        </div>
      </div>);
    }
    const status = booking.appointmentStatus;
    const patientName = booking.user?.fullName || booking.user?.name;
    return (<div className="space-y-8 p-1 md:p-2">
      {/* Breadcrumb / back */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigate("/lab-tech/lab-bookings")}>
          <ArrowLeft className="mr-2 h-4 w-4"/>
          Lab Bookings
        </Button>
      </div>

      {/* Hero */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <FlaskConical className="h-7 w-7 text-primary"/>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {booking.diagnosticTest?.name || "Lab Test"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Booking ID: {booking._id}
              </p>
              <Badge variant="secondary" className={`rounded-full border px-3 py-1 text-xs ${BOOKING_STATUS_STYLES[status] ||
            "border-transparent bg-muted text-muted-foreground"}`}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </Badge>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {status === "CONFIRMED" && (<>
                <Link to={`/lab-tech/update-results?bookingId=${booking._id}`}>
                  <Button className="rounded-xl">
                    <ClipboardEdit className="mr-2 h-4 w-4"/>
                    Enter Results
                  </Button>
                </Link>
                <Button variant="outline" className="rounded-xl border-destructive/30 text-destructive hover:text-destructive" onClick={() => setConfirmCancel(true)}>
                  Cancel Booking
                </Button>
              </>)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Patient Info */}
        <Card className="rounded-3xl border shadow-sm">
          <CardContent className="p-6">
            <h2 className="mb-4 text-base font-semibold">Patient Information</h2>
            <div className="space-y-4">
              <DetailRow icon={User} label="Full Name" value={patientName || null}/>
              <DetailRow icon={Mail} label="Email" value={booking.user?.email || null}/>
              <DetailRow icon={Phone} label="Phone" value={booking.user?.phone || null}/>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Info */}
        <Card className="rounded-3xl border shadow-sm">
          <CardContent className="p-6">
            <h2 className="mb-4 text-base font-semibold">
              Appointment Details
            </h2>
            <div className="space-y-4">
              <DetailRow icon={Calendar} label="Date" value={formatDate(booking.slot?.slotDate || booking.appointmentDate)}/>
              <DetailRow icon={Clock} label="Time Slot" value={booking.slot?.startTime && booking.slot?.endTime
            ? `${booking.slot.startTime} — ${booking.slot.endTime}`
            : booking.slot?.startTime || null}/>
              <DetailRow icon={MapPin} label="Lab Center" value={booking.healthCenter?.name || null}/>
              <DetailRow icon={MapPin} label="Address" value={booking.healthCenter?.address || null}/>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Info */}
      {booking.diagnosticTest && (<Card className="rounded-3xl border shadow-sm">
          <CardContent className="p-6">
            <h2 className="mb-4 text-base font-semibold">Test Information</h2>
            <div className="space-y-4">
              <DetailRow icon={FlaskConical} label="Test Name" value={booking.diagnosticTest.name || null}/>
              {booking.diagnosticTest.description && (<>
                  <Separator />
                  <div>
                    <p className="mb-1 text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.diagnosticTest.description}
                    </p>
                  </div>
                </>)}
              {booking.diagnosticTest.instructions && (<>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground"/>
                      <p className="text-sm font-medium">
                        Preparation Instructions
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {booking.diagnosticTest.instructions}
                    </p>
                  </div>
                </>)}
            </div>
          </CardContent>
        </Card>)}

      {/* Cancel Alert */}
      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive"/>
              Cancel Booking?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the lab booking for{" "}
              <strong>{patientName || "the patient"}</strong>. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={cancelling}>
              Keep Booking
            </AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive hover:bg-destructive/90" disabled={cancelling} onClick={handleCancel}>
              {cancelling ? "Cancelling…" : "Yes, Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
