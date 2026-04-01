import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { SLOT_STATUS_STYLES, SLOT_STATUS_LABEL, getSlotDisplayStatus } from "@/lib/slotUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { ArrowLeft, FlaskConical, Calendar, Clock, MapPin, User, Mail, Phone, AlertTriangle, Loader2, FileText, } from "lucide-react";
// ─── Helpers ──────────────────────────────────────────────────────────────────
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
const BOOKING_STATUS_STYLES = {
    CONFIRMED: "bg-info/10 text-info border-info/20",
    COMPLETED: "bg-success/10 text-success border-success/20",
    CANCELLED: "bg-muted text-muted-foreground border-transparent",
};
// ─── Detail row helper ────────────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, value, }) {
    if (!value)
        return null;
    return (<div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/50">
        <Icon className="h-4 w-4 text-muted-foreground"/>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium break-words">{value}</p>
      </div>
    </div>);
}
// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BookingDetailPage() {
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
                const res = await apiFetch(`/appointment/${bookingId}`);
                setBooking(res?.data || res);
            }
            catch (err) {
                setError(err.message || "Failed to load booking");
            }
            finally {
                setLoading(false);
            }
        })();
    }, [bookingId]);
    async function handleCancel() {
        if (!bookingId)
            return;
        try {
            setCancelling(true);
            await apiFetch(`/updateappointment/${bookingId}`, {
                method: "PUT",
                body: JSON.stringify({ status: "CANCELLED" }),
            });
            setBooking((prev) => prev ? { ...prev, appointmentStatus: "CANCELLED" } : null);
            setConfirmCancel(false);
        }
        catch (err) {
            setError(err.message || "Failed to cancel booking");
        }
        finally {
            setCancelling(false);
        }
    }
    // Compute slot display status for badge (uses slotUtils)
    const slotDisplayStatus = booking?.slot
        ? getSlotDisplayStatus({
            slotDate: booking.slot.slotDate || new Date().toISOString(),
            startTime: booking.slot.startTime || "00:00",
            endTime: booking.slot.endTime || "00:00",
            status: booking.slot.status || "AVAILABLE",
        })
        : null;
    return (<div className="space-y-8 p-1 md:p-2">

      {/* ── Header ── */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="sm" className="rounded-xl gap-2 shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4"/>
            Back
          </Button>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <FlaskConical className="h-3.5 w-3.5"/>
              Booking Detail
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {loading ? "Loading…" : booking?.diagnosticTest?.name || "Lab Booking"}
            </h1>
            {!loading && booking && (<Badge variant="secondary" className={`rounded-full border px-3 py-1 text-[11px] ${BOOKING_STATUS_STYLES[booking.appointmentStatus]}`}>
                {booking.appointmentStatus.charAt(0) + booking.appointmentStatus.slice(1).toLowerCase()}
              </Badge>)}
          </div>
        </div>
      </div>

      {error && (<div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>)}

      {loading ? (<div className="flex items-center justify-center rounded-2xl border border-dashed py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
          Loading booking details…
        </div>) : !booking ? (<div className="rounded-2xl border border-dashed p-10 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/>
          <p className="text-sm font-medium">Booking not found</p>
        </div>) : (<div className="grid gap-6 lg:grid-cols-2">

          {/* ── Patient Details ── */}
          <Card className="rounded-3xl border shadow-sm">
            <CardContent className="p-6 space-y-5">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary"/>
                Patient Details
              </h2>
              <Separator />
              <div className="space-y-4">
                <DetailRow icon={User} label="Full Name" value={booking.user?.name}/>
                <DetailRow icon={Mail} label="Email" value={booking.user?.email}/>
                <DetailRow icon={Phone} label="Phone" value={booking.user?.phone}/>
              </div>
            </CardContent>
          </Card>

          {/* ── Appointment Details ── */}
          <Card className="rounded-3xl border shadow-sm">
            <CardContent className="p-6 space-y-5">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary"/>
                Appointment Details
              </h2>
              <Separator />
              <div className="space-y-4">
                <DetailRow icon={Calendar} label="Date" value={formatDate(booking.slot?.slotDate || booking.appointmentDate)}/>
                <DetailRow icon={Clock} label="Time Slot" value={booking.slot?.startTime && booking.slot?.endTime
                ? `${booking.slot.startTime} — ${booking.slot.endTime}`
                : booking.slot?.startTime}/>
                {slotDisplayStatus && (<div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                      <Clock className="h-4 w-4 text-muted-foreground"/>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Slot Status</p>
                      <Badge variant="secondary" className={`mt-1 rounded-full border px-3 py-0.5 text-[11px] ${SLOT_STATUS_STYLES[slotDisplayStatus]}`}>
                        {SLOT_STATUS_LABEL[slotDisplayStatus]}
                      </Badge>
                    </div>
                  </div>)}
                <DetailRow icon={MapPin} label="Center" value={booking.healthCenter?.name}/>
                <DetailRow icon={MapPin} label="Address" value={booking.healthCenter?.address}/>
                <DetailRow icon={Phone} label="Center Phone" value={booking.healthCenter?.phone}/>
              </div>
            </CardContent>
          </Card>

          {/* ── Test Details ── */}
          <Card className="rounded-3xl border shadow-sm lg:col-span-2">
            <CardContent className="p-6 space-y-5">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary"/>
                Test Information
              </h2>
              <Separator />

              {booking.diagnosticTest?.description && (<div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {booking.diagnosticTest.description}
                  </p>
                </div>)}

              {booking.diagnosticTest?.instructions && (<div className="flex gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 mt-2">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0"/>
                  <div>
                    <p className="text-sm font-semibold mb-1">Preparation Instructions</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {booking.diagnosticTest.instructions}
                    </p>
                  </div>
                </div>)}

              {booking.appointmentStatus === "CONFIRMED" && (<div className="flex justify-end pt-2">
                  <Button variant="outline" className="rounded-xl text-destructive hover:text-destructive border-destructive/30" onClick={() => setConfirmCancel(true)}>
                    Cancel Booking
                  </Button>
                </div>)}
            </CardContent>
          </Card>
        </div>)}

      {/* Cancel confirmation */}
      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The patient's booking will be permanently cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Cancelling…" : "Cancel Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
