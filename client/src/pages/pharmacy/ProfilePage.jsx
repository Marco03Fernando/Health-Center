import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePharmacyAuth } from "@/contexts/PharmacyAuthContext";
import { pharmacyApiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  User,
  Lock,
  ShieldCheck,
  Mail,
  UserCircle2,
  Save,
  Settings,
  CheckCircle2,
} from "lucide-react";

export default function PharmacyProfilePage() {
  const { pharmacist, updateProfile } = usePharmacyAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showPwDialog, setShowPwDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const initials = useMemo(() => {
    if (!pharmacist?.name?.trim()) return "P";
    return pharmacist.name
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("");
  }, [pharmacist?.name]);

  const hasChanges =
    name !== (pharmacist?.name || "") || email !== (pharmacist?.email || "");

  useEffect(() => {
    setName(pharmacist?.name || "");
    setEmail("");
  }, [pharmacist]);

  const handleSave = async () => {
    const token = localStorage.getItem("pharmacy_token");
    if (!token) {
      toast.error("Please log in to save profile changes");
      navigate("/pharmacy/login");
      return;
    }

    const payload = {};
    if (name !== (pharmacist?.name || "")) payload.name = name;
    if (email) payload.email = email;

    if (Object.keys(payload).length === 0) {
      toast("No changes to save");
      return;
    }

    try {
      const res = await pharmacyApiFetch("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (res?.user) {
        updateProfile({ name: res.user.name, email: res.user.email });
        localStorage.setItem("pharmacy_user", JSON.stringify(res.user));
        toast.success("Profile updated successfully");
      } else {
        updateProfile(payload);
        toast.success("Profile updated");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to update profile");
    }
  };

  const handleChangePw = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await pharmacyApiFetch("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setShowPwDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    } catch (err) {
      toast.error(err?.message || "Failed to change password");
    }
  };

  return (
    <div className="space-y-8 p-1 md:p-2">
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Settings className="h-3.5 w-3.5" />
              Account Settings
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pharmacist Profile</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Manage your account details and keep your information up to date.
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
                  <p className="truncate text-base font-semibold">{pharmacist?.name || "-"}</p>
                  <p className="truncate text-sm text-muted-foreground">{pharmacist?.email || "-"}</p>
                  <Badge className="mt-2 rounded-full px-3 py-1 capitalize">
                    {pharmacist?.role || "pharmacist"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <UserCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profile Name</p>
                  <p className="mt-1 text-sm font-semibold">{pharmacist?.name || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10">
                  <Mail className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="mt-1 truncate text-sm font-semibold">{pharmacist?.email || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Role</p>
                  <p className="mt-1 text-sm font-semibold capitalize">
                    {pharmacist?.role || "pharmacist"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit form */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl border shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">New Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter new email"
              />
            </div>
            <Button onClick={handleSave} disabled={!hasChanges && !email} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={showPwDialog} onOpenChange={setShowPwDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>Enter your current password and a new password.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Confirm Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleChangePw} className="w-full">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Update Password
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
