import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, Lock, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function Profile() {
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialization: "",
    clinic: "",
    fee: "",
  });

  const [schedule, setSchedule] = useState({
    startTime: "",
    endTime: "",
    sessionTime: "",
  });

  // Load doctor data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await apiFetch("/doctors/me");

        const doc = data.doctor;

        setForm({
          fullName: doc.fullName || "",
          email: doc.email || "",
          phone: doc.phone || "",
          specialization: doc.specialization || "",
          clinic: doc.clinic || "",
          fee: doc.fee?.toString() || "",
        });

        setSchedule({
          startTime: doc.startTime || "",
          endTime: doc.endTime || "",
          sessionTime: doc.sessionTime?.toString() || "",
        });

      } catch (err: any) {
        toast.error(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await apiFetch("/doctors/me", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          specialization: form.specialization,
          clinic: form.clinic,
          fee: Number(form.fee),
        }),
      });

      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  };

  const handleChangePassword = async () => {
    const currentPassword = prompt("Enter current password");
    const newPassword = prompt("Enter new password");

    if (!currentPassword || !newPassword) return;

    try {
      await apiFetch("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      toast.success("Password changed successfully");
    } catch (err: any) {
      toast.error(err.message || "Password change failed");
    }
  };

  const fields = [
    { key: "fullName", label: "Full Name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "specialization", label: "Specialization", type: "text" },
    { key: "clinic", label: "Clinic", type: "text" },
    { key: "fee", label: "Consultation Fee", type: "number" },
  ];

  if (loading) {
    return <div className="p-6">Loading profile...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                <Input
                  type={f.type}
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Working Hours
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Start Time</Label>
            <Input value={schedule.startTime} readOnly className="bg-muted" />
          </div>

          <div>
            <Label>End Time</Label>
            <Input value={schedule.endTime} readOnly className="bg-muted" />
          </div>

          <div>
            <Label>Session (min)</Label>
            <Input value={schedule.sessionTime} readOnly className="bg-muted" />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Button variant="outline" onClick={handleChangePassword} className="gap-2">
        <Lock className="h-4 w-4" />
        Change Password
      </Button>
    </div>
  );
}