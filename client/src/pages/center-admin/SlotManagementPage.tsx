import { useEffect, useMemo, useState } from "react";
import { useCenterAdmin } from "@/contexts/CenterAdminContext";
import { apiFetch } from "@/lib/api";
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
  Trash2,
  RefreshCw,
  Plus,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type Slot = {
  _id: string;
  center: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED" | "CANCELLED";
};

type SlotsByDate = Record<string, Slot[]>;

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-success/10 text-success border-success/20",
  BOOKED: "bg-info/10 text-info border-info/20",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
};

function groupByDate(slots: Slot[]): SlotsByDate {
  return slots.reduce<SlotsByDate>((acc, slot) => {
    const d = new Date(slot.slotDate);
    const key = d.toLocaleDateString("en-US", {
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

export default function SlotManagementPage() {
  const { centerId } = useCenterAdmin();

  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "expired">("today");

  // Generate form
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    startDate: today,
    numberOfDays: "3",
    openingTime: "08:00",
    closingTime: "17:00",
    slotMinutes: "30",
  });

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

  const todayStr = today;

  const todaySlots = useMemo(
    () =>
      allSlots.filter((s) => {
        const d = new Date(s.slotDate).toISOString().split("T")[0];
        return d === todayStr;
      }),
    [allSlots, todayStr]
  );

  const upcomingSlots = useMemo(
    () =>
      allSlots.filter((s) => {
        const d = new Date(s.slotDate).toISOString().split("T")[0];
        return d > todayStr;
      }),
    [allSlots, todayStr]
  );

  const expiredSlots = useMemo(
    () =>
      allSlots.filter((s) => {
        const d = new Date(s.slotDate).toISOString().split("T")[0];
        return d < todayStr;
      }),
    [allSlots, todayStr]
  );

  const displaySlots =
    activeTab === "today" ? todaySlots : activeTab === "upcoming" ? upcomingSlots : expiredSlots;

  const grouped = useMemo(() => groupByDate(displaySlots), [displaySlots]);
  const sortedDates = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  function toggleDate(dateKey: string) {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey); else next.add(dateKey);
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

      const endDate = (() => {
        const d = new Date(form.startDate);
        d.setDate(d.getDate() + Number(form.numberOfDays) - 1);
        return d.toISOString().split("T")[0];
      })();

      await apiFetch("/generateSlots", {
        method: "POST",
        body: JSON.stringify({
          centerId,
          startDate: form.startDate,
          endDate,
          openingTime: form.openingTime,
          closingTime: form.closingTime,
          slotDurationMinutes: Number(form.slotMinutes),
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

  async function handleDelete(slotId: string) {
    try {
      setDeletingId(slotId);
      setError("");
      await apiFetch(`/deleteSlot/${slotId}`, { method: "DELETE" });
      setAllSlots((prev) => prev.filter((s) => s._id !== slotId));
      setConfirmDeleteId(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete slot");
    } finally {
      setDeletingId(null);
    }
  }

  const tabs: { key: typeof activeTab; label: string; count: number }[] = [
    { key: "today", label: "Slots Today", count: todaySlots.length },
    { key: "upcoming", label: "Upcoming Slots", count: upcomingSlots.length },
    { key: "expired", label: "Expired Slots", count: expiredSlots.length },
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
                    min={today}
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
                  <Label htmlFor="openingTime">Opening Time</Label>
                  <Input
                    id="openingTime"
                    type="time"
                    value={form.openingTime}
                    onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="closingTime">Closing Time</Label>
                  <Input
                    id="closingTime"
                    type="time"
                    value={form.closingTime}
                    onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
                    className="rounded-xl"
                    required
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

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading slots...
            </div>
          ) : displaySlots.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No slots found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDates.map((dateKey) => {
                const dateSlots = grouped[dateKey];
                const isExpanded = expandedDates.has(dateKey);
                return (
                  <div key={dateKey}>
                    <button
                      className="flex w-full items-center justify-between rounded-xl border bg-muted/30 px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
                      onClick={() => toggleDate(dateKey)}
                    >
                      <span>{dateKey}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{dateSlots.length} slots</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {dateSlots
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((slot) => (
                            <div
                              key={slot._id}
                              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                                slot.status === "CANCELLED"
                                  ? "bg-destructive/5"
                                  : slot.status === "BOOKED"
                                  ? "bg-info/5"
                                  : "bg-background"
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-2 font-medium text-sm">
                                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                  {slot.startTime} — {slot.endTime}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {centerId && (slot as any).centerName ? (slot as any).centerName : ""}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge
                                  variant="secondary"
                                  className={`rounded-full border px-2.5 py-0.5 text-[11px] ${STATUS_COLORS[slot.status] || "bg-muted text-muted-foreground border-transparent"}`}
                                >
                                  {slot.status.charAt(0) + slot.status.slice(1).toLowerCase()}
                                </Badge>
                                {slot.status === "AVAILABLE" && (
                                  <button
                                    onClick={() => setConfirmDeleteId(slot._id)}
                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    disabled={deletingId === slot._id}
                                  >
                                    {deletingId === slot._id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirm dialog */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slot?</AlertDialogTitle>
            <AlertDialogDescription>
              This slot will be permanently deleted and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmDeleteId) handleDelete(confirmDeleteId); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
