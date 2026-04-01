import { useEffect, useState } from "react";
import { useCenterAdmin } from "@/contexts/CenterAdminContext";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Clock, Loader2, CheckCircle2, XCircle, Info, } from "lucide-react";
function formatDateTime(value) {
    if (!value)
        return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime()))
        return value;
    return d.toLocaleString();
}
export default function CenterInfoPage() {
    const { centerId } = useCenterAdmin();
    const [center, setCenter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        if (!centerId) {
            setLoading(false);
            return;
        }
        async function load() {
            try {
                setLoading(true);
                setError("");
                // Try fetching by specific center ID from admin/all list
                const res = await apiFetch("/centers/admin/all");
                const list = Array.isArray(res?.data) ? res.data : [];
                const found = list.find((c) => c._id === centerId) || null;
                if (!found) {
                    // Fallback: try public endpoint
                    const pub = await apiFetch("/centers");
                    const pubList = Array.isArray(pub?.data) ? pub.data : Array.isArray(pub) ? pub : [];
                    setCenter(pubList.find((c) => c._id === centerId) || null);
                }
                else {
                    setCenter(found);
                }
            }
            catch (err) {
                setError(err?.message || "Failed to load center info");
            }
            finally {
                setLoading(false);
            }
        }
        load();
    }, [centerId]);
    if (loading) {
        return (<div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
      </div>);
    }
    if (error) {
        return (<div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error}
      </div>);
    }
    return (<div className="space-y-8 p-1 md:p-2">
      {/* Header */}
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5"/>
              Center Information
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {center?.name || "Center Info"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Details and operational information for this health center.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {center && (<>
                <Badge variant="secondary" className={`rounded-full border px-4 py-1.5 text-sm ${center.isActive
                ? "bg-success/10 text-success border-success/20"
                : "bg-muted text-muted-foreground border-transparent"}`}>
                  {center.isActive ? (<><CheckCircle2 className="inline h-3.5 w-3.5 mr-1.5"/>Active</>) : (<><XCircle className="inline h-3.5 w-3.5 mr-1.5"/>Inactive</>)}
                </Badge>
                {center.isFeatured && (<Badge variant="secondary" className="rounded-full border px-4 py-1.5 text-sm bg-amber-500/10 text-amber-600 border-amber-500/20">
                    Featured
                  </Badge>)}
              </>)}
          </div>
        </div>
      </div>

      {!center ? (<div className="rounded-2xl border border-dashed p-10 text-center">
          <Info className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/>
          <p className="text-sm font-medium">No center information available</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account may not be linked to a center yet.
          </p>
        </div>) : (<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {/* Name */}
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 shrink-0">
                <Building2 className="h-5 w-5 text-primary"/>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Center Name</p>
                <p className="mt-1 text-base font-semibold break-words">{center.name || "—"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 shrink-0">
                <MapPin className="h-5 w-5 text-emerald-600"/>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="mt-1 text-base font-semibold break-words">
                  {[center.address, center.district].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Phone */}
          {center.phone && (<Card className="rounded-2xl border shadow-sm">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 shrink-0">
                  <Info className="h-5 w-5 text-violet-600"/>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="mt-1 text-base font-semibold break-words">{center.phone}</p>
                </div>
              </CardContent>
            </Card>)}

          {/* Opening Time */}
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 shrink-0">
                <Clock className="h-5 w-5 text-amber-600"/>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Opening Time</p>
                <p className="mt-1 text-base font-semibold">{center.openingTime || "—"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Closing Time */}
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 shrink-0">
                <Clock className="h-5 w-5 text-rose-600"/>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Closing Time</p>
                <p className="mt-1 text-base font-semibold">{center.closingTime || "—"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Created At */}
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 shrink-0">
                <Info className="h-5 w-5 text-blue-600"/>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="mt-1 text-base font-semibold">{formatDateTime(center.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>)}
    </div>);
}
