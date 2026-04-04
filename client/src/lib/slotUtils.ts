/**
 * Slot status utilities — frontend only.
 *
 * The backend only knows AVAILABLE, BOOKED, and CANCELLED.
 * EXPIRED is a derived display-only status: an AVAILABLE slot whose end
 * datetime is in the past.  It is never written back to the server.
 */

export type SlotDisplayStatus = "AVAILABLE" | "BOOKED" | "CANCELLED" | "EXPIRED";

export interface SlotLike {
  slotDate: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED" | "CANCELLED";
}

/** Combines slotDate + endTime into a Date object in local time.
 *
 * slotDate is stored as UTC midnight representing the *calendar date* intended
 * (e.g. "2026-03-31T00:00:00.000Z" means "March 31").  We extract the UTC
 * year/month/day (the actual calendar date) and combine it with the local
 * business endTime, giving a correct local-time datetime for any timezone.
 */
function getSlotEndDateTime(slot: SlotLike): Date {
  const utc = new Date(slot.slotDate);
  const [hours, minutes] = slot.endTime.split(":").map(Number);
  // Build with UTC date components so the calendar date is preserved across
  // all client timezones, then treat the time as local business hours.
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate(), hours, minutes, 0, 0);
}

/**
 * Returns true if the slot's end datetime is strictly in the past.
 * Only meaningful for AVAILABLE slots; BOOKED/CANCELLED are unaffected.
 */
export function isSlotExpired(slot: SlotLike): boolean {
  return getSlotEndDateTime(slot) <= new Date();
}

/**
 * Returns the effective display status for a slot.
 * CANCELLED and BOOKED preserve their server status.
 * AVAILABLE slots that have already passed are shown as EXPIRED.
 */
export function getSlotDisplayStatus(slot: SlotLike): SlotDisplayStatus {
  if (slot.status === "CANCELLED") return "CANCELLED";
  if (slot.status === "BOOKED") return "BOOKED";
  if (isSlotExpired(slot)) return "EXPIRED";
  return "AVAILABLE";
}

/** Badge + border styles for each display status. */
export const SLOT_STATUS_STYLES: Record<SlotDisplayStatus, string> = {
  AVAILABLE: "bg-success/10 text-success border-success/20",
  BOOKED:    "bg-info/10 text-info border-info/20",
  CANCELLED: "bg-muted text-muted-foreground border-transparent",
  EXPIRED:   "bg-destructive/10 text-destructive border-destructive/20",
};

/** Human-readable label for each display status. */
export const SLOT_STATUS_LABEL: Record<SlotDisplayStatus, string> = {
  AVAILABLE: "Available",
  BOOKED:    "Booked",
  CANCELLED: "Cancelled",
  EXPIRED:   "Expired",
};

/** Card background tint for each display status. */
export const SLOT_CARD_BG: Record<SlotDisplayStatus, string> = {
  AVAILABLE: "bg-background",
  BOOKED:    "bg-info/5",
  CANCELLED: "bg-muted/20",
  EXPIRED:   "bg-destructive/5",
};

/**
 * Extracts the UTC calendar date string (YYYY-MM-DD) from a slot's slotDate.
 * Always compares the UTC date components because slotDate is stored as UTC midnight.
 */
export function getSlotUTCDateStr(slotDate: string): string {
  const d = new Date(slotDate);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
