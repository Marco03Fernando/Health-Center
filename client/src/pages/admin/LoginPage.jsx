import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { adminLogin } from "@/services/admin-auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Heart } from "lucide-react";
export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { login, isAuthenticated, admin } = useAdminAuth();
    const navigate = useNavigate();
    if (isAuthenticated) {
        return <Navigate to={admin?.role === "superadmin" ? "/admin/dashboard" : "/center-admin"} replace/>;
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await adminLogin(email, password);
            if (data?.token) {
                // Sync context state
                await login(email, password);
                const role = data?.admin?.role;
                if (role === "superadmin")
                    navigate("/admin/dashboard");
                else
                    navigate("/center-admin"); // "admin" role → center admin portal
            }
            else {
                setError("Invalid credentials");
            }
        }
        catch {
            setError("Invalid email or password");
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Heart className="h-7 w-7 text-primary"/>
          </div>
          <CardTitle className="text-2xl font-bold">MedAdmin</CardTitle>
          <CardDescription>
            Sign in to manage your healthcare platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@medadmin.com" value={email} onChange={(e) => setEmail(e.target.value)} required/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required/>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            {error && (<p className="text-sm text-center text-destructive">{error}</p>)}
          </form>
        </CardContent>
      </Card>
    </div>);
}
