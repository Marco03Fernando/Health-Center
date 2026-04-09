import React, { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import {
  userLogin,
  userRegister,
  userLogout as apiUserLogout,
  userGetCurrentUser,
} from "@/services/user-auth.service";

// ─── Context ──────────────────────────────────────────────────────────────────
const UserAppContext = createContext(null);

export const useUserApp = () => {
  const ctx = useContext(UserAppContext);
  if (!ctx) throw new Error("useUserApp must be inside UserAppProvider");
  return ctx;
};

function mapAuthToAppUser(user) {
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
export const UserAppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
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

  const login = async (email, password) => {
    try {
      const data = await userLogin(email, password);

      if (data?.user) {
        setUser(mapAuthToAppUser(data.user));
        return data; // changed from true -> full response so caller can inspect role
      }

      return false;
    } catch {
      return false;
    }
  };

  const register = async (input) => {
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
    try {
      await apiUserLogout();
    } catch {
      /* ignore */
    } finally {
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
       window.location.replace("/");
    }
  };

  const changePassword = async (oldPw, newPw) => {
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

  const updateProfile = (data) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  const addToCart = (product, qty = 1) => {
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

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  };

  const updateCartQty = (productId, qty) => {
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

  const clearCart = () => setCart([]);

  const placeOrder = (deliveryMethod) => {
    const order = {
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