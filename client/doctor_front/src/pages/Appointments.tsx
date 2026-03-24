import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar as CalIcon } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

type DoctorData = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  mustChangePassword: boolean;
  name?: string;
  specialization?: string;
  clinic?: string;
  fee?: number;
  startTime?: string;
  endTime?: string;
  sessionTime?: number;
  isActive?: boolean;
  centerId?: string | null;
};

type SlotData = {
  _id?: string;
  id?: string;
  startTime: string;
  endTime?: string;
  isBooked?: boolean;
  isActive?: boolean;
};

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getArrayFromResponse(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.slots)) return data.slots;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export default function Appointments() {
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [slots, setSlots] = useState<SlotData[]>([]);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const doctorRes = await apiFetch("/doctors/me");
        const doc = doctorRes.doctor as DoctorData;
        setDoctor(doc);

        const today = getTodayDate();
        const slotRes = await apiFetch(`/slots?doctorId=${doc.id}&date=${today}`);
        const slotItems = getArrayFromResponse(slotRes);

        setSlots(slotItems);
      } catch (err: any) {
        toast.error(err.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, []);

  if (loading) {
    return <div className="p-6">Loading appointments...</div>;
  }

  if (!doctor) {
    return <div className="p-6">Doctor data not found.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="border-primary/20 bg-accent">
        <CardContent className="flex items-center gap-3 p-4 text-sm text-accent-foreground">
          <CalIcon className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Appointment schedule is read-only</p>
            <p className="text-muted-foreground">
              Your availability is managed by the system based on your working hours.
              Contact administration to update.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            Today&apos;s Schedule
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              Hours:{" "}
              <strong className="text-foreground">
                {doctor.startTime || "-"} – {doctor.endTime || "-"}
              </strong>
            </span>

            <span className="text-muted-foreground">
              Session:{" "}
              <strong className="text-foreground">
                {doctor.sessionTime || 0} min
              </strong>
            </span>

            <span className="text-muted-foreground">
              Total Available Slots:{" "}
              <strong className="text-foreground">{slots.length}</strong>
            </span>
          </div>

          {slots.length === 0 ? (
            <div className="rounded-lg border bg-muted p-6 text-center text-sm text-muted-foreground">
              No available slots found for today.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {slots.map((slot, index) => (
                <div
                  key={slot._id || slot.id || `${slot.startTime}-${index}`}
                  className="flex items-center justify-center rounded-lg border border-success/30 bg-success/10 p-3 text-sm font-medium text-success transition-colors"
                >
                  {slot.startTime}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-success" /> Available
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}