import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Heart } from "lucide-react";
import { apiFetch, labTechApiFetch, pharmacyApiFetch } from "@/lib/api";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Doctors", to: "/doctors" },
  { label: "Lab Tests", to: "/lab-tests" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

function getNormalizedUser(data) {
  const user = data?.admin || data?.user || data;
  if (!user) return null;

  return {
    ...user,
    role: String(user.role || "").toLowerCase(),
  };
}

function resolvePortalFromRole(role) {
  switch (role) {
    case "admin":
    case "superadmin":
      return {
        role,
        dashboard: "/admin/dashboard",
        logoutType: "admin",
      };

    case "center-admin":
      return {
        role,
        dashboard: "/center-admin",
        logoutType: "admin",
      };

    case "lab-tech":
      return {
        role,
        dashboard: "/lab-tech",
        logoutType: "admin",
      };

    case "pharmacy":
    case "pharmacist":
      return {
        role,
        dashboard: "/pharmacy",
        logoutType: "pharmacy",
      };

    case "doctor":
      return {
        role,
        dashboard: "/doctor",
        logoutType: "user",
      };

    default:
      return {
        role,
        dashboard: "/user",
        logoutType: "user",
      };
  }
}

async function tryGetPortal(fetcher, path) {
  try {
    const data = await fetcher(path);
    const user = getNormalizedUser(data);
    if (!user?.role) return null;
    return resolvePortalFromRole(user.role);
  } catch {
    return null;
  }
}

function removeKeys(keys) {
  keys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

function clearAllAuthStorage() {
  removeKeys([
    "admin_token",
    "lab_tech_token",
    "pharmacy_token",
    "pharmacy_user",
    "token",
    "user",
  ]);
}

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activePortal, setActivePortal] = useState(null);
  const navigate = useNavigate();

  const detectPortal = useCallback(async () => {
    setCheckingAuth(true);

    let portal = null;

    try {
      // 1) Normal auth flow (user / doctor)
      portal = await tryGetPortal(apiFetch, "/auth/me");

      // 2) Admin-style auth flow (admin / center-admin)
      if (!portal) {
        portal = await tryGetPortal(apiFetch, "/admin/auth/me");
      }

      // 3) Pharmacy auth flow
      if (!portal) {
        portal = await tryGetPortal(pharmacyApiFetch, "/auth/me");
      }

      // 4) Lab-tech auth flow
      if (!portal) {
        portal = await tryGetPortal(labTechApiFetch, "/admin/auth/me");
      }

      // If nothing is valid, remove stale client auth
      if (!portal) {
        clearAllAuthStorage();
      }

      setActivePortal(portal);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const runDetect = async () => {
      if (!mounted) return;
      await detectPortal();
    };

    runDetect();

    window.addEventListener("focus", runDetect);
    window.addEventListener("storage", runDetect);
    window.addEventListener("auth-changed", runDetect);

    return () => {
      mounted = false;
      window.removeEventListener("focus", runDetect);
      window.removeEventListener("storage", runDetect);
      window.removeEventListener("auth-changed", runDetect);
    };
  }, [detectPortal]);

  const handleLogout = async () => {
    try {
      if (activePortal?.logoutType === "admin") {
        await apiFetch("/admin/auth/logout", { method: "POST" });
      } else if (activePortal?.logoutType === "pharmacy") {
        await pharmacyApiFetch("/auth/logout", { method: "POST" });
      } else {
        await apiFetch("/auth/logout", { method: "POST" });
      }
    } catch {
      // ignore logout errors, still clear client state
    } finally {
      clearAllAuthStorage();
      setActivePortal(null);
      setOpen(false);
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/", { replace: true });
    }
  };

  const isLoggedIn = !!activePortal;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="section-container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-extrabold text-foreground">
            Medi<span className="text-primary">Care</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden min-w-[180px] items-center justify-end gap-3 md:flex">
          {checkingAuth ? (
            <div className="h-9 w-[160px]" />
          ) : isLoggedIn ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to={activePortal.dashboard}>Dashboard</Link>
              </Button>
              <Button size="sm" variant="destructive" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/user">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/user">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground md:hidden"
          onClick={() => setOpen(!open)}
          type="button"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-card px-4 pb-4 pt-2 md:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              {l.label}
            </Link>
          ))}

          <div className="mt-3 flex gap-2">
            {checkingAuth ? null : isLoggedIn ? (
              <>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to={activePortal.dashboard} onClick={() => setOpen(false)}>
                    Dashboard
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to="/user" onClick={() => setOpen(false)}>
                    Login
                  </Link>
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link to="/user" onClick={() => setOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;