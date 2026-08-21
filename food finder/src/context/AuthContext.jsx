/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("srf_token") || null);
  const [loading, setLoading] = useState(true);

  // Ref to hold the role-switch navigation callback registered by AppContent
  const onRoleSwitchRef = useRef(null);

  // Register a callback that fires after every successful role switch
  const registerRoleSwitchHandler = useCallback((fn) => {
    onRoleSwitchRef.current = fn;
  }, []);

  // Core login — sets token + user state
  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem("srf_token", res.access_token);
    setToken(res.access_token);
    const nextUser = {
      id: res.user_id,
      email: res.email,
      full_name: res.full_name,
      role: res.role,
    };
    setUser(nextUser);
    return { res, role: res.role };
  }, []);

  const register = useCallback(async (userData) => {
    const res = await api.register(userData);
    localStorage.setItem("srf_token", res.access_token);
    setToken(res.access_token);
    setUser({
      id: res.user_id,
      email: res.email,
      full_name: res.full_name,
      role: res.role,
    });
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("srf_token");
    setToken(null);
    setUser(null);
  }, []);

  // Demo quick-switch — defined as a regular function so it's available
  // immediately (no hoisting issue with useEffect on mount)
  const loginDemoUser = useCallback(async (roleType) => {
    try {
      let result;
      if (roleType === "customer") {
        result = await login("arun@example.com", "customer123");
      } else if (roleType === "owner") {
        result = await login("owner@anjappar.tn", "owner123");
      } else if (roleType === "admin") {
        result = await login("admin@smartfinder.tn", "admin123");
      } else {
        return;
      }

      // After successful login, fire the navigation callback
      if (onRoleSwitchRef.current && result?.role) {
        onRoleSwitchRef.current(result.role);
      }
    } catch (e) {
      console.warn("Demo login failed:", e.message || e);
    }
  }, [login]);

  // On mount: restore session or default-login as customer
  useEffect(() => {
    async function initUser() {
      const storedToken = localStorage.getItem("srf_token");
      if (storedToken) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (err) {
          console.error("Session restore failed, re-logging as customer", err);
          logout();
          try {
            await login("arun@example.com", "customer123");
          } catch {
            // ignore initial auto-login error
          }
        }
      } else {
        // No token at all — auto-login as demo customer
        try {
          await login("arun@example.com", "customer123");
        } catch {
          // ignore initial auto-login error
        }
      }
      setLoading(false);
    }
    initUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        loginDemoUser,
        registerRoleSwitchHandler,
        isAuthenticated: !!user,
        isCustomer: user?.role === "CUSTOMER",
        isOwner: user?.role === "RESTAURANT_OWNER",
        isAdmin: user?.role === "ADMIN",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}