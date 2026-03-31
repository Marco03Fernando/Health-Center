import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "@/lib/auth";

type ProtectedRouteProps = {
  children: JSX.Element;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isDoctor, setIsDoctor] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await getCurrentUser();

        if (data?.user?.role === "doctor") {
          setIsDoctor(true);
        } else {
          setIsDoctor(false);
        }
      } catch {
        setIsDoctor(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!isDoctor) {
    return <Navigate to="/login" replace />;
  }

  return children;
}