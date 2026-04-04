import { useMemo, useState } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, } from "@/components/ui/dialog";
import { toast } from "sonner";
import { User, Lock, ShieldCheck, Mail, UserCircle2, Save, Settings, CheckCircle2, } from "lucide-react";
export default function ProfilePage() {
    const { admin, updateProfile } = useAdminAuth();
    const [name, setName] = useState(admin?.name || "");
    const [email, setEmail] = useState(admin?.email || "");
    const [showPwDialog, setShowPwDialog] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const initials = useMemo(() => {
        if (!admin?.name?.trim())
            return "A";
        return admin.name
            .trim()
            .split(" ")
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("");
    }, [admin?.name]);
    const hasChanges = name !== (admin?.name || "") || email !== (admin?.email || "");
    const handleSave = () => {
        updateProfile({ name, email });
        toast.success("Profile updated successfully");
    };
    const handleChangePw = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Please fill all password fields");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New password and confirm password do not match");
            return;
        }
        setShowPwDialog(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Password changed successfully");
    };
    return (<div className="space-y-8 p-1 md:p-2">
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Settings className="h-3.5 w-3.5"/>
              Account Settings
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Profile</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Manage your administrator account details, keep profile information
                up to date, and maintain account security in one place.
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
                  <p className="truncate text-base font-semibold">{admin?.name || "-"}</p>
                  <p className="truncate text-sm text-muted-foreground">{admin?.email || "-"}</p>
                  <Badge className="mt-2 rounded-full px-3 py-1 capitalize">
                    {admin?.role || "admin"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <UserCircle2 className="h-5 w-5 text-primary"/>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profile Name</p>
                  <p className="mt-1 text-sm font-semibold">{admin?.name || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10">
                  <Mail className="h-5 w-5 text-amber-600"/>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="mt-1 truncate text-sm font-semibold">{admin?.email || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <ShieldCheck className="h-5 w-5 text-emerald-600"/>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Role</p>
                  <p className="mt-1 text-sm font-semibold capitalize">
                    {admin?.role || "admin"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
        <Card className="rounded-3xl border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Profile Information</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update your name and email used for the administrator account.
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pt-3">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                  <Input className="h-11 rounded-xl pl-10" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name"/>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                  <Input type="email" className="h-11 rounded-xl pl-10" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email"/>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Profile status</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {hasChanges
            ? "You have unsaved changes in your profile."
            : "Your profile information is up to date."}
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
              <Button onClick={handleSave} className="h-11 rounded-xl px-5" disabled={!hasChanges}>
                <Save className="mr-2 h-4 w-4"/>
                Save Changes
              </Button>

              <Dialog open={showPwDialog} onOpenChange={setShowPwDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-11 rounded-xl px-5">
                    <Lock className="mr-2 h-4 w-4"/>
                    Change Password
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden">
                  <DialogHeader className="border-b bg-background px-6 py-5">
                    <DialogTitle className="text-xl">Change Password</DialogTitle>
                    <DialogDescription>
                      Update your account password to keep your admin account secure.
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
                            and symbols for better security.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={handleChangePw} className="h-11 rounded-xl px-5">
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
              <CardTitle className="text-lg">Account Summary</CardTitle>
              <p className="text-sm text-muted-foreground">
                Quick overview of your administrator account.
              </p>
            </CardHeader>

            <CardContent className="space-y-3 pt-3">
              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">Full Name</span>
                <span className="max-w-[55%] truncate text-sm font-semibold">
                  {admin?.name || "-"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="max-w-[55%] truncate text-sm font-semibold">
                  {admin?.email || "-"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm font-semibold capitalize">
                  {admin?.role || "admin"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Security</CardTitle>
              <p className="text-sm text-muted-foreground">
                Basic account safety recommendations.
              </p>
            </CardHeader>

            <CardContent className="space-y-3 pt-3">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-sm font-medium">Password protection</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Change your password regularly and avoid reusing old passwords.
                </p>
              </div>

              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-sm font-medium">Account identity</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Make sure your displayed name and email stay accurate for admin activity.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);
}
