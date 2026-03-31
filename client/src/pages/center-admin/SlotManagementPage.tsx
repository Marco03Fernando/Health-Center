import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCenterAdmin } from "@/contexts/CenterAdminContext";
import { apiFetch } from "@/lib/api";
import {
  isSlotExpired,
  getSlotDisplayStatus,
  getSlotUTCDateStr,
  SLOT_STATUS_STYLES,
  SLOT_STATUS_LABEL,
  SLOT_CARD_BG,
} from "@/lib/slotUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CalendarDays,
  Loader2,
  PowerOff,
  Eye,
  RefreshCw,
  Plus,
  Clock,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SlotStatus = "AVAILABLE" | "BOOKED" | "CANCELLED";

type Slot = {
  _id: string;
  center: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  /**
   * When BOOKED: the backend populates this field as a booking object.
   * It may be a string ID or a populated object { _id: string, ... }.
   */
  appoinment?: string | { _id: string } | null;
};

/** Extract booking ID regardless of whether appoinment is a string or populated object. */
function getBookingId(slot: Slot): string | null {
  if (!slot.appoinment) return null;
  if (typeof slot.appoinment === "string") return slot.appoinment;
  return slot.appoinment._id || null;
}

type SlotsByDate = Record<string, Slot[]>;

type ActiveTab = "today" | "upcoming" | "expired";

type GenerateForm = {
  startDate: string;
  numberOfDays: string;
  openingTime: string;
  closingTime: string;
  slotMinutes: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByDate(slots: Slot[]): SlotsByDate {
  return slots.reduce<SlotsByDate>((acc, slot) => {
    const key = new Date(slot.slotDate).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});
}

function buildEndDate(startDate: string, numberOfDays: number): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() + numberOfDays - 1);
  return d.toISOString().split("T")[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type SlotCardProps = {
  slot: Slot;
  processingId: string | null;
  onCancel: (id: string) => void;
  onViewBooking: (bookingId: string) => void;
};

function SlotCard({ slot, processingId, onCancel, onViewBooking }: SlotCardProps) {
  const displayStatus = getSlotDisplayStatus(slot);
  const isProcessing = processingId === slot._id;

  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${SLOT_CARD_BG[displayStatus]}`}
    >
      <div className="flex items-center gap-2 font-medium text-sm">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        {slot.startTime} — {slot.endTime}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {displayStatus === "AVAILABLE" && (
          <button
            title="Cancel Slot"
            disabled={isProcessing}
            onClick={() => onCancel(slot._id)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
          >
            {isProcessing
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <PowerOff className="h-3.5 w-3.5" />
            }
          </button>
        )}

        {displayStatus === "BOOKED" && getBookingId(slot) && (
          <button
            title="View Booking Details"
            onClick={() => onViewBooking(getBookingId(slot)!)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-info/10 hover:text-info transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        )}

        <Badge
          variant="secondary"
          className={`rounded-full border px-2.5 py-0.5 text-[11px] ${SLOT_STATUS_STYLES[displayStatus]}`}
        >
          {SLOT_STATUS_LABEL[displayStatus]}
        </Badge>
      </div>
    </div>
  );
}

type DateGroupProps = {
  dateKey: string;
  slots: Slot[];
  isExpanded: boolean;
  processingId: string | null;
  onToggle: (key: string) => void;
  onCancelSlot: (id: string) => void;
  onViewBooking: (bookingId: string) => void;
  /** When provided, a delete icon appears in the header (expired tab only). */
  onDeleteDate?: () => void;
};

function DateGroup({
  dateKey, slots, isExpanded, processingId, onToggle, onCancelSlot, onViewBooking, onDeleteDate,
}: DateGroupProps) {
  const sorted = useMemo(
    () => [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [slots],
  );

  return (
    <div>
      <button
        className="flex w-full items-center justify-between rounded-xl border bg-muted/30 px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
        onClick={() => onToggle(dateKey)}
      >
        <span>{dateKey}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{slots.length} slots</span>
          {onDeleteDate && (
            <span
              role="button"
              title="Delete expired slots for this date"
              onClick={(e) => { e.stopPropagation(); onDeleteDate(); }}
              className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </span>
          )}
          {isExpanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>

      {isExpanded && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((slot) => (
            <SlotCard
              key={slot._id}
              slot={slot}
              processingId={processingId}
              onCancel={onCancelSlot}
              onViewBooking={onViewBooking}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TODAY = (() => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
})();

const DEFAULT_FORM: GenerateForm = {
  startDate: TODAY,
  numberOfDays: "3",
  openingTime: "08:00",
  closingTime: "17:00",
  slotMinutes: "30",
};

export default function SlotManagementPage() {
  const { centerId } = useCenterAdmin();
  const navigate = useNavigate();

  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<ActiveTab>("today");
  const [form, setForm] = useState<GenerateForm>(DEFAULT_FORM);

  // ── Delete-expired state ─────────────────────────────────────────────────────
  const [deletingExpired, setDeletingExpired] = useState(false);
  /** UTC date string (YYYY-MM-DD) awaiting delete confirmation, or null when dialog is closed. */
  const [deleteConfirmDate, setDeleteConfirmDate] = useState<string | null>(null);
  const [confirmDeleteAllExpired, setConfirmDeleteAllExpired] = useState(false);
  /** Fetched from center: read-only in the generate form. */
  const [centerHours, setCenterHours] = useState<{ openingTime?: string; closingTime?: string } | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────────

  async function fetchSlots() {
    if (!centerId) { setLoading(false); return; }
    try {
      setLoading(true);
      setError("");
      const res = await apiFetch(`/getSlotsByCenter/${centerId}`);
      const raw: Slot[] = res?.slots || res?.data || (Array.isArray(res) ? res : []);
      setAllSlots(raw);
    } catch (err: any) {
      setError(err.message || "Failed to load slots");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSlots(); }, [centerId]);

  // Fetch center opening/closing hours once to pre-fill generate form
  useEffect(() => {
    if (!centerId) return;
    apiFetch("/centers/admin/all")
      .then((res) => {
        const list: any[] = Array.isArray(res?.data) ? res.data : [];
        const found = list.find((c: any) => c._id === centerId);
        if (found) {
          setCenterHours({ openingTime: found.openingTime, closingTime: found.closingTime });
          setForm((prev) => ({
            ...prev,
            openingTime: found.openingTime || prev.openingTime,
            closingTime: found.closingTime || prev.closingTime,
          }));
        }
      })
      .catch(() => { /* silently ignore – form retains defaults */ });
  }, [centerId]);

  // ── Derived slot lists ───────────────────────────────────────────────────────

  /** ALL today's slots — available, booked, and expired — for display in the Today tab. */
  const todaySlots = useMemo(
    () => allSlots.filter((s) => getSlotUTCDateStr(s.slotDate) === TODAY),
    [allSlots],
  );

  /** Count of available (non-expired) slots today — shown in the tab badge. */
  const todayAvailableCount = useMemo(
    () => todaySlots.filter((s) => s.status === "AVAILABLE" && !isSlotExpired(s)).length,
    [todaySlots],
  );

  /** Future-dated slots — tomorrow onwards, can never be expired. */
  const upcomingSlots = useMemo(
    () => allSlots.filter((s) => getSlotUTCDateStr(s.slotDate) > TODAY),
    [allSlots],
  );

  /** All slots whose end time has already passed, including today's past slots. */
  const expiredSlots = useMemo(
    () => allSlots.filter((s) => isSlotExpired(s)),
    [allSlots],
  );

  const displaySlots =
    activeTab === "today" ? todaySlots
    : activeTab === "upcoming" ? upcomingSlots
    : expiredSlots;

  const grouped = useMemo(() => groupByDate(displaySlots), [displaySlots]);
  const sortedDates = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function toggleDate(dateKey: string) {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      next.has(dateKey) ? next.delete(dateKey) : next.add(dateKey);
      return next;
    });
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!centerId) return;
    try {
      setGenerating(true);
      setError("");
      setSuccessMsg("");
      await apiFetch("/generateSlots", {
        method: "POST",
        body: JSON.stringify({
          healthCenterId: centerId,
          startDateStr: form.startDate,
          numberOfDays: Number(form.numberOfDays),
          slotMinutes: Number(form.slotMinutes),
        }),
      });
      setSuccessMsg("Slots generated successfully.");
      await fetchSlots();
    } catch (err: any) {
      setError(err.message || "Failed to generate slots");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCancelSlot(slotId: string) {
    try {
      setProcessingId(slotId);
      setError("");
      await apiFetch(`/updateSlot/${slotId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      // Optimistic update — avoids a full refetch
      setAllSlots((prev) =>
        prev.map((s) => (s._id === slotId ? { ...s, status: "CANCELLED" as SlotStatus } : s)),
      );
      setConfirmCancelId(null);
    } catch (err: any) {
      setError(err.message || "Failed to cancel slot");
    } finally {
      setProcessingId(null);
    }
  }

  function handleViewBooking(bookingId: string) {
    navigate(`/center-admin/lab-bookings/${bookingId}`);
  }

  async function handleDeleteExpiredByDate(utcDate: string) {
    if (!centerId) return;
    try {
      setDeletingExpired(true);
      setError("");
      await apiFetch(`/deleteExpiredUnbooked?centerId=${centerId}&date=${utcDate}`, { method: "DELETE" });
      setSuccessMsg(`Expired slots for ${utcDate} deleted.`);
      setDeleteConfirmDate(null);
      await fetchSlots();
    } catch (err: any) {
      setError(err.message || "Failed to delete expired slots");
    } finally {
      setDeletingExpired(false);
    }
  }

  async function handleDeleteAllExpired() {
    if (!centerId) return;
    try {
      setDeletingExpired(true);
      setError("");
      await apiFetch(`/deleteExpiredUnbooked?centerId=${centerId}`, { method: "DELETE" });
      setSuccessMsg("All expired unbooked slots deleted.");
      setConfirmDeleteAllExpired(false);
      await fetchSlots();
    } catch (err: any) {
      setError(err.message || "Failed to delete expired slots");
    } finally {
      setDeletingExpired(false);
    }
  }

  // ── Tab config ───────────────────────────────────────────────────────────────

  const tabs: { key: ActiveTab; label: string; count: number }[] = [
    { key: "today",    label: "Today",    count: todayAvailableCount },
    { key: "upcoming", label: "Upcoming", count: upcomingSlots.length },
    { key: "expired",  label: "Expired",  count: expiredSlots.length },
  ];

  return (
    <div className="space-y-8 p-1 md:p-2">
      {/* Header */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="space-y-3 mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            Slot Management
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Slot Management</h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Generate and manage appointment slots for this center.
            </p>
          </div>
        </div>

        {/* Generate form */}
        <Card className="rounded-2xl border shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">Generate New Slots</h2>
            </div>
            <form onSubmit={handleGenerate}>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    min={TODAY}
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="numDays">Number of Days (1-14)</Label>
                  <Input
                    id="numDays"
                    type="number"
                    min="1"
                    max="14"
                    value={form.numberOfDays}
                    onChange={(e) => setForm({ ...form, numberOfDays: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slotMins">Slot Minutes</Label>
                  <Input
                    id="slotMins"
                    type="number"
                    min="10"
                    max="120"
                    step="5"
                    value={form.slotMinutes}
                    onChange={(e) => setForm({ ...form, slotMinutes: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="openingTime">
                    Opening Time{" "}
                    <span className="text-xs text-muted-foreground">(from center)</span>
                  </Label>
                  <Input
                    id="openingTime"
                    type="time"
                    value={form.openingTime}
                    disabled
                    className="rounded-xl opacity-60 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="closingTime">
                    Closing Time{" "}
                    <span className="text-xs text-muted-foreground">(from center)</span>
                  </Label>
                  <Input
                    id="closingTime"
                    type="time"
                    value={form.closingTime}
                    disabled
                    className="rounded-xl opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button type="submit" disabled={generating || !centerId} className="rounded-xl gap-2">
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
                  ) : (
                    <><Plus className="h-4 w-4" />Generate Slots</>
                  )}
                </Button>
              </div>
            </form>
            {successMsg && (
              <p className="mt-3 text-sm text-success">{successMsg}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Slot tabs */}
      <Card className="rounded-3xl border shadow-sm">
        <CardContent className="p-5 md:p-6">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-border pb-3 mb-5 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                  activeTab === tab.key
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === tab.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto rounded-xl gap-1 shrink-0"
              onClick={fetchSlots}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Delete all expired toolbar — visible on expired tab when there are expired slots */}
          {activeTab === "expired" && expiredSlots.length > 0 && (
            <div className="flex items-center justify-end mb-4">
              <Button
                variant="destructive"
                size="sm"
                className="rounded-xl gap-1.5"
                onClick={() => setConfirmDeleteAllExpired(true)}
                disabled={deletingExpired}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete All Expired
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading slots...
            </div>
          ) : displaySlots.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No slots for this view</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDates.map((dateKey) => {
                const groupSlots = grouped[dateKey];
                const utcDate = getSlotUTCDateStr(groupSlots[0].slotDate);
                return (
                  <DateGroup
                    key={dateKey}
                    dateKey={dateKey}
                    slots={groupSlots}
                    isExpanded={expandedDates.has(dateKey)}
                    processingId={processingId}
                    onToggle={toggleDate}
                    onCancelSlot={(id) => setConfirmCancelId(id)}
                    onViewBooking={handleViewBooking}
                    onDeleteDate={
                      activeTab === "expired"
                        ? () => setDeleteConfirmDate(utcDate)
                        : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete ALL expired slots confirmation */}
      <AlertDialog open={confirmDeleteAllExpired} onOpenChange={setConfirmDeleteAllExpired}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all expired unbooked slots?</AlertDialogTitle>
            <AlertDialogDescription>
              All expired, unbooked slots for this center will be permanently deleted.
              Booked slots will not be affected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingExpired}
              onClick={handleDeleteAllExpired}
            >
              {deletingExpired ? "Deleting…" : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete expired slots by date confirmation */}
      <AlertDialog
        open={!!deleteConfirmDate}
        onOpenChange={() => setDeleteConfirmDate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expired slots for {deleteConfirmDate}?</AlertDialogTitle>
            <AlertDialogDescription>
              Only unbooked expired slots for this date will be deleted.
              Booked slots will not be affected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingExpired}
              onClick={() => { if (deleteConfirmDate) handleDeleteExpiredByDate(deleteConfirmDate); }}
            >
              {deletingExpired ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel slot confirmation */}
      <AlertDialog open={!!confirmCancelId} onOpenChange={() => setConfirmCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this slot?</AlertDialogTitle>
            <AlertDialogDescription>
              The slot will be marked as Cancelled. Patients will no longer be able to book it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!processingId}
              onClick={() => { if (confirmCancelId) handleCancelSlot(confirmCancelId); }}
            >
              {processingId ? "Cancelling..." : "Cancel Slot"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
