import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import {
  userLogin,
  userRegister,
  userLogout as apiUserLogout,
  userGetCurrentUser,
} from "@/services/user-auth.service";
import type { Appointment, Prescription, CartItem, Order, Product, AuthUser } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppUser = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  doctorProfileId?: string | null;
};

type RegisterInput = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
};

interface UserAppState {
  user: AppUser | null;
  cart: CartItem[];
  orders: Order[];
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (oldPw: string, newPw: string) => Promise<boolean>;
  updateProfile: (data: Partial<AppUser>) => void;
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  placeOrder: (deliveryMethod: "delivery" | "pickup") => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const UserAppContext = createContext<UserAppState | null>(null);

export const useUserApp = () => {
  const ctx = useContext(UserAppContext);
  if (!ctx) throw new Error("useUserApp must be inside UserAppProvider");
  return ctx;
};

function mapAuthToAppUser(user: AuthUser): AppUser {
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

// ─── Provider ─────────────────────────────────────────────────────────────────

export const UserAppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await userGetCurrentUser();
        if (data?.user) {
          setUser(mapAuthToAppUser(data.user));
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await userLogin(email, password);
      if (data?.user) {
        setUser(mapAuthToAppUser(data.user));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const register = async (input: RegisterInput) => {
    try {
      await userRegister(input);
      const loginData = await userLogin(input.email, input.password);
      if (loginData?.user) {
        setUser(mapAuthToAppUser(loginData.user));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try { await apiUserLogout(); } catch { /* ignore */ }
    finally {
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  const changePassword = async (oldPw: string, newPw: string) => {
    try {
      await apiFetch("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: oldPw, newPassword: newPw }),
      });
      return true;
    } catch {
      return false;
    }
  };

  const updateProfile = (data: Partial<AppUser>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
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
    if (qty <= 0) { removeFromCart(productId); return; }
    setCart((prev) =>
      prev.map((c) => (c.product.id === productId ? { ...c, quantity: qty } : c))
    );
  };

  const clearCart = () => setCart([]);

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

  if (isAuthLoading) return null;

  return (
    <UserAppContext.Provider
      value={{
        user,
        cart,
        orders,
        isAuthLoading,
        login,
        register,
        logout,
        changePassword,
        updateProfile,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        placeOrder,
      }}
    >
      {children}
    </UserAppContext.Provider>
  );
};
