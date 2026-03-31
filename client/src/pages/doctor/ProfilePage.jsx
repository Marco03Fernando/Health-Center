import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Save, Lock, Clock, User, Mail, Phone, Stethoscope, Building2, Wallet, ShieldCheck, Loader2, Settings, CheckCircle2, CalendarDays, Plus, X, } from "lucide-react";
import { apiFetch } from "@/lib/api";
const DAY_OPTIONS = [
    { value: "mon", label: "Mon" },
    { value: "tue", label: "Tue" },
    { value: "wed", label: "Wed" },
    { value: "thu", label: "Thu" },
    { value: "fri", label: "Fri" },
    { value: "sat", label: "Sat" },
    { value: "sun", label: "Sun" },
];
const initialForm = {
    fullName: "",
    email: "",
    phone: "",
    specialization: "",
    clinic: "",
    fee: "",
};
const initialSchedule = {
    startTime: "",
    endTime: "",
    sessionTime: "",
    workingDays: [],
    holidayDates: [],
};
function normalizeHolidayDateList(values) {
    return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}
export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [initialLoadedForm, setInitialLoadedForm] = useState(initialForm);
    const [schedule, setSchedule] = useState(initialSchedule);
    const [initialLoadedSchedule, setInitialLoadedSchedule] = useState(initialSchedule);
    const [holidayInput, setHolidayInput] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                const data = await apiFetch("/doctors/me");
                const doc = data.doctor;
                const loadedForm = {
                    fullName: doc.fullName || doc.name || "",
                    email: doc.email || "",
                    phone: doc.phone || "",
                    specialization: doc.specialization || "",
                    clinic: doc.clinic || "",
                    fee: doc.fee?.toString() || "",
                };
                const loadedSchedule = {
                    startTime: doc.startTime || "",
                    endTime: doc.endTime || "",
                    sessionTime: doc.sessionTime?.toString() || "",
                    workingDays: Array.isArray(doc.workingDays) ? doc.workingDays : [],
                    holidayDates: Array.isArray(doc.holidayDates) ? doc.holidayDates : [],
                };
                setForm(loadedForm);
                setInitialLoadedForm(loadedForm);
                setSchedule(loadedSchedule);
                setInitialLoadedSchedule(loadedSchedule);
            }
            catch (err) {
                toast.error(err.message || "Failed to load profile");
            }
            finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);
    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };
    const handleScheduleChange = (field, value) => {
        setSchedule((prev) => ({ ...prev, [field]: value }));
    };
    const toggleWorkingDay = (day) => {
        setSchedule((prev) => {
            const exists = prev.workingDays.includes(day);
            return {
                ...prev,
                workingDays: exists
                    ? prev.workingDays.filter((d) => d !== day)
                    : [...prev.workingDays, day],
            };
        });
    };
    const addHolidayDate = () => {
        if (!holidayInput.trim())
            return;
        setSchedule((prev) => ({
            ...prev,
            holidayDates: normalizeHolidayDateList([...prev.holidayDates, holidayInput]),
        }));
        setHolidayInput("");
    };
    const removeHolidayDate = (date) => {
        setSchedule((prev) => ({
            ...prev,
            holidayDates: prev.holidayDates.filter((d) => d !== date),
        }));
    };
    const hasChanges = useMemo(() => {
        return (JSON.stringify(form) !== JSON.stringify(initialLoadedForm) ||
            JSON.stringify(schedule) !== JSON.stringify(initialLoadedSchedule));
    }, [form, initialLoadedForm, schedule, initialLoadedSchedule]);
    const initials = useMemo(() => {
        if (!form.fullName.trim())
            return "DR";
        return form.fullName
            .trim()
            .split(" ")
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("");
    }, [form.fullName]);
    const handleSave = async () => {
        if (!schedule.workingDays.length) {
            toast.error("Select at least one working day");
            return;
        }
        try {
            setSaving(true);
            const cleanedHolidayDates = normalizeHolidayDateList(schedule.holidayDates);
            await apiFetch("/doctors/me", {
                method: "PATCH",
                body: JSON.stringify({
                    fullName: form.fullName,
                    name: form.fullName,
                    email: form.email,
                    phone: form.phone,
                    specialization: form.specialization,
                    clinic: form.clinic,
                    fee: Number(form.fee || 0),
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    sessionTime: Number(schedule.sessionTime || 0),
                    workingDays: schedule.workingDays,
                    holidayDates: cleanedHolidayDates,
                }),
            });
            const nextSchedule = {
                ...schedule,
                holidayDates: cleanedHolidayDates,
            };
            setSchedule(nextSchedule);
            setInitialLoadedForm(form);
            setInitialLoadedSchedule(nextSchedule);
            toast.success("Profile and schedule updated successfully");
        }
        catch (err) {
            toast.error(err.message || "Update failed");
        }
        finally {
            setSaving(false);
        }
    };
    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Please fill all password fields");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New password and confirm password do not match");
            return;
        }
        try {
            setChangingPassword(true);
            await apiFetch("/auth/change-password", {
                method: "PATCH",
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            setShowPasswordDialog(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            toast.success("Password changed successfully");
        }
        catch (err) {
            toast.error(err.message || "Password change failed");
        }
        finally {
            setChangingPassword(false);
        }
    };
    const fields = [
        { key: "fullName", label: "Full Name", type: "text", icon: User },
        { key: "email", label: "Email", type: "email", icon: Mail },
        { key: "phone", label: "Phone", type: "tel", icon: Phone },
        { key: "specialization", label: "Specialization", type: "text", icon: Stethoscope },
        { key: "clinic", label: "Clinic", type: "text", icon: Building2 },
        { key: "fee", label: "Consultation Fee", type: "number", icon: Wallet },
    ];
    if (loading) {
        return (<div className="space-y-6 p-1 md:p-2">
        <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
          Loading profile...
        </div>
      </div>);
    }
    return (<div className="space-y-8 p-1 md:p-2">
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Settings className="h-3.5 w-3.5"/>
              Doctor Profile
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Manage your doctor account details, working hours, working days,
                and holiday dates used for slot generation.
              </p>
            </div>
          </div>

          <Card className="w-full max-w-md rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <span className="text-xl font-bold text-primary">{initials}</span>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">
                    {form.fullName || "Doctor"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {form.specialization || "Medical Practitioner"}
                  </p>
                  <Badge className="mt-2 rounded-full px-3 py-1">Doctor Account</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Clinic</p>
              <p className="mt-2 text-base font-semibold">{form.clinic || "-"}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Specialization</p>
              <p className="mt-2 text-base font-semibold">{form.specialization || "-"}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Consultation Fee</p>
              <p className="mt-2 text-base font-semibold">
                {form.fee ? `LKR ${Number(form.fee).toLocaleString()}` : "-"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
        <Card className="rounded-3xl border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Personal Information</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update your doctor profile and schedule settings used across the system.
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pt-3">
            <div className="grid gap-5 sm:grid-cols-2">
              {fields.map((field) => {
            const Icon = field.icon;
            return (<div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <div className="relative">
                      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                      <Input type={field.type} value={form[field.key]} onChange={(e) => handleChange(field.key, e.target.value)} className="h-11 rounded-xl pl-10"/>
                    </div>
                  </div>);
        })}
            </div>

            <div className="space-y-5 rounded-2xl border bg-muted/20 p-4">
              <div>
                <p className="text-sm font-medium">Schedule Configuration</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  These settings control your working pattern and future slot generation.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={schedule.startTime} onChange={(e) => handleScheduleChange("startTime", e.target.value)} className="h-11 rounded-xl"/>
                </div>

                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={schedule.endTime} onChange={(e) => handleScheduleChange("endTime", e.target.value)} className="h-11 rounded-xl"/>
                </div>

                <div className="space-y-2">
                  <Label>Session Time (min)</Label>
                  <Input type="number" min="1" value={schedule.sessionTime} onChange={(e) => handleScheduleChange("sessionTime", e.target.value)} className="h-11 rounded-xl"/>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Working Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((day) => {
            const selected = schedule.workingDays.includes(day.value);
            return (<Button key={day.value} type="button" variant={selected ? "default" : "outline"} className="h-10 rounded-full px-4" onClick={() => toggleWorkingDay(day.value)}>
                        {day.label}
                      </Button>);
        })}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Holiday Dates</Label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input type="date" value={holidayInput} onChange={(e) => setHolidayInput(e.target.value)} className="h-11 rounded-xl"/>
                  <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={addHolidayDate}>
                    <Plus className="mr-2 h-4 w-4"/>
                    Add Holiday
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {schedule.holidayDates.length ? (schedule.holidayDates.map((date) => (<Badge key={date} variant="outline" className="flex items-center gap-2 rounded-full px-3 py-1">
                        {date}
                        <button type="button" onClick={() => removeHolidayDate(date)} className="rounded-full">
                          <X className="h-3.5 w-3.5"/>
                        </button>
                      </Badge>))) : (<span className="text-sm text-muted-foreground">No holiday dates added</span>)}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Profile status</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {hasChanges
            ? "You have unsaved changes in your profile or schedule."
            : "Your profile and schedule are up to date."}
                  </p>
                </div>

                <Badge variant="secondary" className={`rounded-full px-3 py-1 ${hasChanges
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"}`}>
                  {hasChanges ? "Unsaved changes" : "Up to date"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={handleSave} disabled={!hasChanges || saving} className="h-11 rounded-xl px-5">
                {saving ? (<Loader2 className="mr-2 h-4 w-4 animate-spin"/>) : (<Save className="mr-2 h-4 w-4"/>)}
                Save Changes
              </Button>

              <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-11 rounded-xl px-5">
                    <Lock className="mr-2 h-4 w-4"/>
                    Change Password
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-lg overflow-hidden rounded-3xl p-0">
                  <DialogHeader className="border-b bg-background px-6 py-5">
                    <DialogTitle className="text-xl">Change Password</DialogTitle>
                    <DialogDescription>
                      Update your password to keep your doctor account secure.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="px-6 pb-6">
                    <div className="space-y-5 py-5">
                      <div className="space-y-2">
                        <Label>Current Password</Label>
                        <Input type="password" className="h-11 rounded-xl" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password"/>
                      </div>

                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input type="password" className="h-11 rounded-xl" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password"/>
                      </div>

                      <div className="space-y-2">
                        <Label>Confirm Password</Label>
                        <Input type="password" className="h-11 rounded-xl" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password"/>
                      </div>

                      <div className="rounded-2xl border bg-muted/20 p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground"/>
                          <p className="text-sm text-muted-foreground">
                            Use a strong password with a mix of letters, numbers,
                            and symbols for better account security.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={handleChangePassword} disabled={changingPassword} className="h-11 rounded-xl px-5">
                          {changingPassword ? (<Loader2 className="mr-2 h-4 w-4 animate-spin"/>) : (<Lock className="mr-2 h-4 w-4"/>)}
                          Update Password
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-3xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary"/>
                Working Hours
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                These values are used by the backend schedule logic.
              </p>
            </CardHeader>

            <CardContent className="space-y-3 pt-3">
              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">Start Time</span>
                <span className="text-sm font-semibold">{schedule.startTime || "-"}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">End Time</span>
                <span className="text-sm font-semibold">{schedule.endTime || "-"}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">Session Time</span>
                <span className="text-sm font-semibold">
                  {schedule.sessionTime ? `${schedule.sessionTime} min` : "-"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-primary"/>
                Availability Rules
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Working days and holidays that affect slot creation.
              </p>
            </CardHeader>

            <CardContent className="space-y-4 pt-3">
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Working Days</p>
                <div className="flex flex-wrap gap-2">
                  {schedule.workingDays.length ? (schedule.workingDays.map((day) => {
            const label = DAY_OPTIONS.find((item) => item.value === day)?.label || day;
            return (<Badge key={day} variant="outline" className="rounded-full px-3 py-1">
                          {label}
                        </Badge>);
        })) : (<span className="text-sm text-muted-foreground">No working days selected</span>)}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-muted-foreground">Holiday Dates</p>
                <div className="flex flex-wrap gap-2">
                  {schedule.holidayDates.length ? (schedule.holidayDates.map((date) => (<Badge key={date} variant="outline" className="rounded-full px-3 py-1">
                        {date}
                      </Badge>))) : (<span className="text-sm text-muted-foreground">No holiday dates added</span>)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary"/>
                Account Security
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Basic recommendations for keeping your account safe.
              </p>
            </CardHeader>

            <CardContent className="space-y-3 pt-3">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-sm font-medium">Password protection</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Change your password regularly and do not share it with others.
                </p>
              </div>

              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-sm font-medium">Profile accuracy</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep your contact details, clinic name, specialization, and availability settings up to date.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />
    </div>);
}
