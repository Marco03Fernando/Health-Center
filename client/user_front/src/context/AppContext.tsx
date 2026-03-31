import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Appointment, Prescription, CartItem, Order, Product } from "@/types";
import { mockAppointments, mockPrescriptions, mockOrders } from "@/data/mock";
import { apiFetch } from "@/lib/api";
import {
  loginUser,
  getCurrentUser,
  logoutUser as apiLogoutUser,
  AuthUser,
} from "@/lib/auth";

type AppUser = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: "patient" | "doctor" | "receptionist" | "pharmacy";
  mustChangePassword: boolean;
  doctorProfileId?: string | null;
};

type RegisterInput = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
};

interface AppState {
  user: AppUser | null;
  appointments: Appointment[];
  prescriptions: Prescription[];
  cart: CartItem[];
  orders: Order[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (user: RegisterInput) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (oldPw: string, newPw: string) => Promise<boolean>;
  updateProfile: (data: Partial<AppUser>) => void;
  addAppointment: (apt: Appointment) => void;
  cancelAppointment: (id: string) => void;
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  placeOrder: (deliveryMethod: "delivery" | "pickup") => void;
}

const AppContext = createContext<AppState | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};

function mapAuthUserToAppUser(user: AuthUser): AppUser {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    doctorProfileId: user.doctorProfileId ?? null,
  };
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [prescriptions] = useState<Prescription[]>(mockPrescriptions);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await getCurrentUser();

        if (data?.user) {
          const mappedUser = mapAuthUserToAppUser(data.user);
          setUser(mappedUser);
          localStorage.setItem("hc_user", JSON.stringify(mappedUser));
        } else {
          setUser(null);
          localStorage.removeItem("hc_user");
        }
      } catch {
        setUser(null);
        localStorage.removeItem("hc_user");
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("hc_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("hc_user");
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const data = await loginUser(email, password);

      if (data?.user) {
        const mappedUser = mapAuthUserToAppUser(data.user);
        setUser(mappedUser);
        localStorage.setItem("hc_user", JSON.stringify(mappedUser));
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  const register = async (data: RegisterInput) => {
    try {
      const payload = {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        password: data.password,
      };

      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const loginData = await loginUser(payload.email, payload.password);

      if (loginData?.user) {
        const mappedUser = mapAuthUserToAppUser(loginData.user);
        setUser(mappedUser);
        localStorage.setItem("hc_user", JSON.stringify(mappedUser));
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiLogoutUser();
    } catch {
      // ignore API logout error
    } finally {
      setUser(null);
      localStorage.removeItem("hc_user");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  const changePassword = async (oldPw: string, newPw: string) => {
    try {
      await apiFetch("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: oldPw,
          newPassword: newPw,
        }),
      });

      return true;
    } catch {
      return false;
    }
  };

  const updateProfile = (data: Partial<AppUser>) => {
    if (!user) return;

    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem("hc_user", JSON.stringify(updated));
  };

  const addAppointment = (apt: Appointment) => {
    setAppointments((prev) => [apt, ...prev]);
  };

  const cancelAppointment = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
    );
  };

  const addToCart = (product: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);

      if (existing) {
        return prev.map((c) =>
          c.product.id === product.id
            ? { ...c, quantity: c.quantity + qty }
            : c
        );
      }

      return [...prev, { product, quantity: qty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((c) =>
        c.product.id === productId ? { ...c, quantity: qty } : c
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = (deliveryMethod: "delivery" | "pickup") => {
    const order: Order = {
      id: `ORD-${String(orders.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString().split("T")[0],
      items: cart.map((c) => ({
        name: c.product.name,
        quantity: c.quantity,
        price: c.product.price,
      })),
      total: cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0),
      status: "processing",
      deliveryMethod,
    };

    setOrders((prev) => [order, ...prev]);
    clearCart();
  };

  if (authLoading) return null;

  return (
    <AppContext.Provider
      value={{
        user,
        appointments,
        prescriptions,
        cart,
        orders,
        login,
        register,
        logout,
        changePassword,
        updateProfile,
        addAppointment,
        cancelAppointment,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        placeOrder,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};