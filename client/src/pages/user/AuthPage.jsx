import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserApp } from "@/contexts/UserAppContext";
import { adminLogin } from "@/services/admin-auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Heart,
  Activity,
  ShieldCheck,
} from "lucide-react";

const getRedirectByRole = (role, fallbackRedirect = "/user") => {
  const normalizedRole = String(role || "").toLowerCase();

  if (normalizedRole === "doctor") return "/doctor";
  if (normalizedRole === "lab-tech" || normalizedRole === "lab_tech") return "/lab-tech";
  if (normalizedRole === "pharmacy" || normalizedRole === "pharmacist") return "/pharmacy";
  if (normalizedRole === "center-admin") return "/center-admin";
  if (normalizedRole === "admin" || normalizedRole === "superadmin") {
    return "/admin/dashboard";
  }

  return fallbackRedirect;
};

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const { login, register } = useUserApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/user";

  const clearAllPortalTokens = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("lab_tech_token");
    localStorage.removeItem("pharmacy_token");
    localStorage.removeItem("user");
    localStorage.removeItem("pharmacy_user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("lab_tech_token");
    sessionStorage.removeItem("pharmacy_token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("pharmacy_user");
  };

  const storeTokenByRole = (role, token) => {
    const normalizedRole = String(role || "").toLowerCase();

    clearAllPortalTokens();

    if (!token) return;

    if (normalizedRole === "lab-tech" || normalizedRole === "lab_tech") {
      localStorage.setItem("lab_tech_token", token);
      return;
    }

    if (normalizedRole === "pharmacy" || normalizedRole === "pharmacist") {
      localStorage.setItem("pharmacy_token", token);
      return;
    }

    if (
      normalizedRole === "admin" ||
      normalizedRole === "superadmin" ||
      normalizedRole === "center-admin"
    ) {
      localStorage.setItem("admin_token", token);
      return;
    }

    localStorage.setItem("token", token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      const loginData = await login(email, password);

      if (loginData?.user) {
        const role = loginData.user.role;
        const token = loginData?.token;

        storeTokenByRole(role, token);
        window.dispatchEvent(new Event("auth-changed"));

        const destination = getRedirectByRole(role, redirectTo);
        navigate(destination, { replace: true });
        return;
      }

      try {
        const adminData = await adminLogin(email, password);

        if (adminData?.admin || adminData?.token) {
          const adminRole = adminData?.admin?.role;
          const token = adminData?.token;

          storeTokenByRole(adminRole, token);
          window.dispatchEvent(new Event("auth-changed"));

          const destination = getRedirectByRole(adminRole, "/admin/dashboard");
          navigate(destination, { replace: true });
          return;
        }
      } catch {
        // fall through
      }

      setError("Invalid email or password");
      return;
    }

    if (!fullName || !phone || !email || !password) {
      setError("All fields are required");
      return;
    }

    const ok = await register({ fullName, phone, email, password });

    if (ok) {
      navigate(redirectTo, { replace: true });
    } else {
      setError("Email already registered");
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,rgba(232,250,247,0.95)_0%,rgba(244,252,251,0.98)_45%,rgba(255,255,255,1)_100%)]">
      <div className="relative min-h-screen">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-teal-100/70 blur-3xl" />
          <div className="absolute top-1/3 right-0 h-64 w-64 rounded-full bg-cyan-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid w-full items-center gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="hidden lg:block">
              <div className="max-w-xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white/80 px-4 py-2 text-sm font-medium text-teal-700 shadow-sm">
                  <Heart className="h-4 w-4 fill-current" />
                  Trusted digital healthcare platform
                </div>

                <h1 className="text-4xl font-bold leading-tight text-slate-900 xl:text-5xl">
                  Secure access to your
                  <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    {" "}healthcare portal
                  </span>
                </h1>

                <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
                  Access consultations, records, lab services, and care workflows
                  through one clean and secure platform.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Secure login</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Safe role-based access for each portal.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                      <Activity className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Fast access</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Automatically redirected after sign in.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <div className="mb-6 text-center lg:hidden">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-md">
                    <Heart className="h-7 w-7 text-white" />
                  </div>
                  <h1 className="mt-4 text-2xl font-bold text-slate-900">
                    MediCare
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    One secure login to manage your health
                  </p>
                </div>

                <Card className="border-white/80 bg-white/88 shadow-xl backdrop-blur">
                  <CardHeader className="space-y-3 pb-5">
                    <div className="hidden lg:flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-md">
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-slate-900">MediCare</p>
                        <p className="text-sm text-slate-500">Healthcare portal access</p>
                      </div>
                    </div>

                    <div>
                      <CardTitle className="text-2xl text-slate-900">
                        {isLogin ? "Welcome back" : "Create account"}
                      </CardTitle>
                      <CardDescription className="pt-1 text-slate-600">
                        {isLogin
                          ? "Sign in to your account to continue"
                          : "Register as a new patient to get started"}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {!isLogin && (
                        <>
                          <Input
                            placeholder="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="h-11 rounded-xl border-slate-200 bg-white"
                          />
                          <Input
                            placeholder="Phone Number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="h-11 rounded-xl border-slate-200 bg-white"
                          />
                        </>
                      )}

                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-xl border-slate-200 bg-white"
                      />

                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 rounded-xl border-slate-200 bg-white"
                      />

                      {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="h-11 w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-sm hover:from-teal-600 hover:to-cyan-600"
                      >
                        {isLogin ? "Sign In" : "Create Account"}
                      </Button>
                    </form>

                    <div className="mt-5 rounded-2xl bg-teal-50/80 px-4 py-3 text-xs text-teal-800"></div>

                    <p className="mt-5 text-center text-sm text-slate-600">
                      {isLogin ? "Don't have an account? " : "Already have an account? "}
                      <button
                        type="button"
                        className="font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                        onClick={() => {
                          setIsLogin(!isLogin);
                          setError("");
                        }}
                      >
                        {isLogin ? "Register" : "Sign In"}
                      </button>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;