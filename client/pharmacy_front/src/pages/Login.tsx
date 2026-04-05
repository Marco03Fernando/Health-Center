import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/pharmacy", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ok = await login(email, password);

      if (!ok) {
        alert("Only pharmacist accounts can access this frontend.");
        return;
      }

      navigate("/pharmacy", { replace: true });
    } catch (error: any) {
      alert(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Pharmacist Login</h1>
          <p className="text-sm text-muted-foreground">Sign in to access the pharmacy dashboard</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full rounded-lg border bg-background p-3 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            className="w-full rounded-lg border bg-background p-3 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary p-3 text-primary-foreground disabled:opacity-70"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
