import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { User, Mail, Phone, Shield, Lock, LogOut, Save } from "lucide-react";
const ProfilePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");
    const [oldPw, setOldPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    useEffect(() => {
        async function loadProfile() {
            try {
                setLoading(true);
                const res = await apiFetch("/auth/me");
                const user = res?.user;
                setFullName(user?.fullName || "");
                setPhone(user?.phone || "");
                setEmail(user?.email || "");
                setRole(user?.role || "");
            }
            catch (err) {
                toast.error(err?.message || "Failed to load profile");
            }
            finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);
    const handleSave = async () => {
        try {
            if (!fullName.trim() || !phone.trim() || !email.trim()) {
                toast.error("Full name, phone and email are required");
                return;
            }
            setSavingProfile(true);
            const res = await apiFetch("/auth/me", {
                method: "PATCH",
                body: JSON.stringify({
                    fullName: fullName.trim(),
                    phone: phone.trim(),
                    email: email.trim().toLowerCase(),
                }),
            });
            const user = res?.user;
            setFullName(user?.fullName || "");
            setPhone(user?.phone || "");
            setEmail(user?.email || "");
            setRole(user?.role || role);
            toast.success(res?.message || "Profile updated successfully");
        }
        catch (err) {
            toast.error(err?.message || "Failed to update profile");
        }
        finally {
            setSavingProfile(false);
        }
    };
    const handleChangePw = async () => {
        try {
            if (!oldPw || !newPw || !confirmPw) {
                toast.error("Please fill all password fields");
                return;
            }
            if (newPw !== confirmPw) {
                toast.error("Passwords do not match");
                return;
            }
            if (newPw.length < 6) {
                toast.error("Password must be at least 6 characters");
                return;
            }
            setSavingPassword(true);
            const res = await apiFetch("/auth/change-password", {
                method: "PATCH",
                body: JSON.stringify({
                    currentPassword: oldPw,
                    newPassword: newPw,
                }),
            });
            toast.success(res?.message || "Password changed successfully");
            setOldPw("");
            setNewPw("");
            setConfirmPw("");
        }
        catch (err) {
            toast.error(err?.message || "Failed to change password");
        }
        finally {
            setSavingPassword(false);
        }
    };
    const handleLogout = async () => {
        try {
            setLoggingOut(true);
            await apiFetch("/auth/logout", { method: "POST" });
            toast.success("Logged out successfully");
            navigate("/user/auth");
        }
        catch (err) {
            toast.error(err?.message || "Logout failed");
        }
        finally {
            setLoggingOut(false);
        }
    };
    if (loading) {
        return (<div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>);
    }
    return (<div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="rounded-3xl border bg-gradient-to-r from-primary/10 via-background to-accent p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary"/>
          </div>

          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account information and security settings.
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm text-foreground">
                <Mail className="w-4 h-4"/>
                {email || "No email"}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm text-foreground capitalize">
                <Shield className="w-4 h-4"/>
                {role || "patient"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-xl">Personal Information</CardTitle>
          <CardDescription>Keep your details accurate for appointments and communication.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-2 block">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                <Input className="pl-10 h-11 rounded-xl" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name"/>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                <Input className="pl-10 h-11 rounded-xl" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone number"/>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                <Input type="email" className="pl-10 h-11 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email"/>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full h-11 rounded-xl" disabled={savingProfile}>
            <Save className="w-4 h-4 mr-2"/>
            {savingProfile ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-xl">Security</CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <Input type="password" className="pl-10 h-11 rounded-xl" placeholder="Current password" value={oldPw} onChange={(e) => setOldPw(e.target.value)}/>
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <Input type="password" className="pl-10 h-11 rounded-xl" placeholder="New password" value={newPw} onChange={(e) => setNewPw(e.target.value)}/>
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <Input type="password" className="pl-10 h-11 rounded-xl" placeholder="Confirm new password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}/>
          </div>

          <Button variant="outline" onClick={handleChangePw} className="w-full h-11 rounded-xl" disabled={savingPassword}>
            {savingPassword ? "Changing Password..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full h-11 rounded-xl" onClick={handleLogout} disabled={loggingOut}>
        <LogOut className="w-4 h-4 mr-2"/>
        {loggingOut ? "Logging out..." : "Logout"}
      </Button>
    </div>);
};
export default ProfilePage;
