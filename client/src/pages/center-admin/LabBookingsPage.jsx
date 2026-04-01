import { useEffect, useMemo, useState } from "react";
import { useCenterAdmin } from "@/contexts/CenterAdminContext";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { FlaskConical, Search, Loader2, Calendar, Clock, MapPin, FileText, AlertTriangle, } from "lucide-react";
const STATUS_FILTERS = [
    { label: "All", value: "all" },
    { label: "Upcoming", value: "CONFIRMED" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
];
const STATUS_STYLES = {
    CONFIRMED: "bg-info/10 text-info border-info/20",
    COMPLETED: "bg-success/10 text-success border-success/20",
    CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
};
function formatDate(rawDate) {
    if (!rawDate)
        return "—";
    return new Date(rawDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}
export default function CenterLabBookingsPage() {
    const { centerId } = useCenterAdmin();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selected, setSelected] = useState(null);
    const [cancelId, setCancelId] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    async function fetchBookings() {
        if (!centerId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError("");
            const res = await apiFetch(`/getappointments/${centerId}`);
            const raw = res?.data || res?.appointments || (Array.isArray(res) ? res : []);
            setBookings(raw);
        }
        catch (err) {
            setError(err.message || "Failed to load lab bookings");
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => { fetchBookings(); }, [centerId]);
    async function handleCancel(id) {
        try {
            setCancelling(true);
            await apiFetch(`/updateappointment/${id}`, {
                method: "PUT",
                body: JSON.stringify({ status: "CANCELLED" }),
            });
            await fetchBookings();
            setCancelId(null);
            if (selected?._id === id) {
                setSelected((prev) => prev ? { ...prev, appointmentStatus: "CANCELLED" } : null);
            }
        }
        catch (err) {
            setError(err.message || "Failed to cancel booking");
            setCancelId(null);
        }
        finally {
            setCancelling(false);
        }
    }
    const filtered = useMemo(() => {
        return bookings.filter((b) => {
            const q = search.toLowerCase();
            const matchSearch = !q ||
                (b.diagnosticTest?.name || "").toLowerCase().includes(q) ||
                (b.user?.fullName || "").toLowerCase().includes(q) ||
                (b.user?.email || "").toLowerCase().includes(q);
            const matchStatus = statusFilter === "all" || b.appointmentStatus === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [bookings, search, statusFilter]);
    const confirmedCount = bookings.filter((b) => b.appointmentStatus === "CONFIRMED").length;
    const completedCount = bookings.filter((b) => b.appointmentStatus === "COMPLETED").length;
    const cancelledCount = bookings.filter((b) => b.appointmentStatus === "CANCELLED").length;
    return (<div className="space-y-8 p-1 md:p-2">
      {/* Header */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            <FlaskConical className="h-3.5 w-3.5"/>
            Lab Booking Management
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lab Bookings</h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              All diagnostic test bookings for this center.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Upcoming", value: confirmedCount, color: "text-info" },
            { label: "Completed", value: completedCount, color: "text-success" },
            { label: "Cancelled", value: cancelledCount, color: "text-destructive" },
        ].map(({ label, value, color }) => (<Card key={label} className="rounded-2xl border shadow-none">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`mt-2 text-2xl font-bold ${color}`}>{loading ? "--" : value}</p>
              </CardContent>
            </Card>))}
        </div>
      </div>

      {error && (<div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>)}

      <Card className="rounded-3xl border shadow-sm">
        <CardContent className="p-5 md:p-6">
          {/* Filters */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">Booking Records</h2>
              <p className="text-sm text-muted-foreground">
                {filtered.length} of {bookings.length} bookings
              </p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center w-full lg:w-auto">
              <div className="relative w-full md:min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                <Input placeholder="Search by test name or patient..." className="h-11 rounded-xl pl-10" value={search} onChange={(e) => setSearch(e.target.value)}/>
              </div>
              <div className="flex gap-2 flex-wrap">
                {STATUS_FILTERS.map((f) => (<Button key={f.value} variant={statusFilter === f.value ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(f.value)} className="rounded-xl shrink-0">
                    {f.label}
                  </Button>))}
              </div>
            </div>
          </div>

          {loading ? (<div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
              Loading lab bookings...
            </div>) : filtered.length === 0 ? (<div className="rounded-2xl border border-dashed p-10 text-center">
              <FlaskConical className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/>
              <p className="text-sm font-medium">No lab bookings found</p>
            </div>) : (<div className="space-y-4">
              {filtered.map((b) => (<Card key={b._id} className="cursor-pointer rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md" onClick={() => setSelected(b)}>
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                          <FlaskConical className="h-5 w-5 text-primary"/>
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold">
                              {b.diagnosticTest?.name || "Lab Test"}
                            </h3>
                            <Badge variant="secondary" className={`rounded-full border px-3 py-1 text-[11px] ${STATUS_STYLES[b.appointmentStatus] || "bg-muted text-muted-foreground border-transparent"}`}>
                              {b.appointmentStatus.charAt(0) + b.appointmentStatus.slice(1).toLowerCase()}
                            </Badge>
                          </div>
                          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 shrink-0"/>
                              <span className="truncate">
                                {formatDate(b.slot?.slotDate || b.appointmentDate)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 shrink-0"/>
                              <span className="truncate">
                                {b.slot?.startTime && b.slot?.endTime
                    ? `${b.slot.startTime} — ${b.slot.endTime}`
                    : b.slot?.startTime || "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 shrink-0"/>
                              <span className="truncate">{b.healthCenter?.name || "—"}</span>
                            </div>
                            {b.user?.fullName && (<div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 shrink-0"/>
                                <span className="truncate">{b.user.fullName}</span>
                              </div>)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={(e) => { e.stopPropagation(); setSelected(b); }}>
                          Details
                        </Button>
                        {b.appointmentStatus === "CONFIRMED" && (<Button variant="outline" size="sm" className="rounded-xl text-destructive hover:text-destructive border-destructive/30" onClick={(e) => { e.stopPropagation(); setCancelId(b._id); }}>
                            Cancel
                          </Button>)}
                      </div>
                    </div>
                  </CardContent>
                </Card>))}
            </div>)}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
            <DialogTitle className="text-xl">
              {selected?.diagnosticTest?.name || "Lab Booking"}
            </DialogTitle>
            <DialogDescription>Full booking details</DialogDescription>
          </DialogHeader>
          {selected && (<div className="max-h-[80vh] overflow-y-auto px-6 pb-6">
              <div className="space-y-5 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                { label: "Status", value: selected.appointmentStatus },
                { label: "Patient", value: selected.user?.fullName },
                { label: "Patient Email", value: selected.user?.email },
                { label: "Patient Phone", value: selected.user?.phone },
                {
                    label: "Date",
                    value: formatDate(selected.slot?.slotDate || selected.appointmentDate),
                },
                {
                    label: "Time Slot",
                    value: selected.slot?.startTime && selected.slot?.endTime
                        ? `${selected.slot.startTime} — ${selected.slot.endTime}`
                        : selected.slot?.startTime,
                },
                { label: "Lab Center", value: selected.healthCenter?.name },
                { label: "Address", value: selected.healthCenter?.address },
            ].map(({ label, value }) => value ? (<div key={label} className="rounded-2xl border bg-muted/30 p-4">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="mt-1 text-sm font-semibold break-words">{value}</p>
                      </div>) : null)}
                </div>

                {selected.diagnosticTest?.description && (<div className="rounded-2xl border p-4">
                    <p className="mb-2 text-sm font-semibold">Test Description</p>
                    <p className="text-sm text-muted-foreground">
                      {selected.diagnosticTest.description}
                    </p>
                  </div>)}

                {selected.diagnosticTest?.instructions && (<div className="flex gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0"/>
                    <div>
                      <p className="text-sm font-semibold mb-1">Preparation Instructions</p>
                      <p className="text-sm text-muted-foreground">
                        {selected.diagnosticTest.instructions}
                      </p>
                    </div>
                  </div>)}

                {selected.appointmentStatus === "CONFIRMED" && (<div className="flex justify-end">
                    <Button variant="outline" className="rounded-xl text-destructive hover:text-destructive border-destructive/30" onClick={() => setCancelId(selected._id)}>
                      Cancel Booking
                    </Button>
                  </div>)}
              </div>
            </div>)}
        </DialogContent>
      </Dialog>

      {/* Cancel confirm */}
      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Lab Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The booking will be permanently cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (cancelId)
        handleCancel(cancelId); }} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Cancel Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
