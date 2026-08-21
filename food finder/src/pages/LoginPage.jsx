import { useState } from "react";
import { 
  AlertCircle, Eye, EyeOff, Sun, Moon
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export function LoginPage({ onLoginSuccess, onNavigate }) {
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuickDemoLogin = async (demoRoleKey) => {
    setError(null);
    setLoading(true);
    try {
      if (demoRoleKey === "CUSTOMER") {
        setEmail("arun@example.com");
        setPassword("customer123");
        const { role: userRole } = await login("arun@example.com", "customer123");
        onLoginSuccess?.(userRole);
      } else if (demoRoleKey === "RESTAURANT_OWNER") {
        setEmail("owner@anjappar.tn");
        setPassword("owner123");
        const { role: userRole } = await login("owner@anjappar.tn", "owner123");
        onLoginSuccess?.(userRole);
      } else if (demoRoleKey === "ADMIN") {
        setEmail("admin@smartfinder.tn");
        setPassword("admin123");
        const { role: userRole } = await login("admin@smartfinder.tn", "admin123");
        onLoginSuccess?.(userRole);
      }
    } catch (err) {
      setError(err.message || "Failed to log in with demo account.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegisterMode) {
        const payload = {
          email,
          password,
          full_name: fullName,
          phone: phone || undefined,
          role,
        };
        const res = await register(payload);
        onLoginSuccess?.(res.role);
      } else {
        const { role: userRole } = await login(email, password);
        onLoginSuccess?.(userRole);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: theme === "dark" ? "#0A0D14" : "#F8FAFC",
      color: theme === "dark" ? "#FFFFFF" : "#0F172A",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
      padding: "2rem 1rem",
      fontFamily: "var(--font-sans)"
    }}>
      {/* Top Bar / Header */}
      <div className="container" style={{
        maxWidth: "1100px",
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "3rem"
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate?.("home")}
          style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}
        >
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #FF3B5C 0%, #FF541E 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            boxShadow: "0 4px 12px rgba(255, 59, 92, 0.4)"
          }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 900 }}>🍴</span>
          </div>
          <span style={{ fontSize: "1.45rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
            Smart<span style={{ color: "#FF3B5C" }}>Food</span>
          </span>
        </div>

        {/* Theme Toggle Button matching top right design */}
        <button
          onClick={toggleTheme}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: "var(--radius-full)",
            backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.08)" : "#FFFFFF",
            border: "1px solid",
            borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.15)" : "#E2E8F0",
            color: theme === "dark" ? "#FFFFFF" : "#0F172A",
            fontSize: "0.8rem",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)"
          }}
        >
          {theme === "dark" ? <Sun size={14} style={{ color: "#F59E0B" }} /> : <Moon size={14} style={{ color: "#64748B" }} />}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </div>

      {/* Main Hero Header */}
      <div style={{ textAlign: "center", maxWidth: "600px", marginBottom: "2.5rem" }}>
        <h1 style={{
          fontSize: "3.2rem",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          marginBottom: "0.75rem"
        }}>
          Find. Book. <span style={{
            background: "linear-gradient(135deg, #FF3B5C 0%, #FF6B35 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>Feast.</span>
        </h1>
        <p style={{
          fontSize: "1rem",
          color: theme === "dark" ? "#94A3B8" : "#64748B",
          fontWeight: 500,
          lineHeight: 1.5
        }}>
          Discover nearby restaurants, check real-time wait times, and reserve your table in seconds.
        </p>
      </div>

      {/* Centered Glassmorphic Auth Card */}
      <div style={{
        width: "100%",
        maxWidth: "460px",
        backgroundColor: theme === "dark" ? "rgba(21, 29, 46, 0.95)" : "#FFFFFF",
        borderRadius: "24px",
        border: "1px solid",
        borderColor: theme === "dark" ? "#26334D" : "#E2E8F0",
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
        padding: "2rem",
        backdropFilter: "blur(12px)"
      }}>
        {/* Tab Switcher (Login / Register) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          backgroundColor: theme === "dark" ? "rgba(15, 23, 42, 0.6)" : "#F1F5F9",
          padding: "0.25rem",
          borderRadius: "14px",
          marginBottom: "1.75rem",
          border: "1px solid",
          borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "#E2E8F0"
        }}>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(false); setError(null); }}
            style={{
              padding: "0.7rem",
              borderRadius: "12px",
              border: "none",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: "pointer",
              background: !isRegisterMode
                ? "linear-gradient(135deg, #FF3B5C 0%, #FF541E 100%)"
                : "transparent",
              color: !isRegisterMode ? "#FFFFFF" : (theme === "dark" ? "#94A3B8" : "#64748B"),
              boxShadow: !isRegisterMode ? "0 4px 14px rgba(255, 59, 92, 0.4)" : "none",
              transition: "all 0.25s ease"
            }}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => { setIsRegisterMode(true); setError(null); }}
            style={{
              padding: "0.7rem",
              borderRadius: "12px",
              border: "none",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: "pointer",
              background: isRegisterMode
                ? "linear-gradient(135deg, #FF3B5C 0%, #FF541E 100%)"
                : "transparent",
              color: isRegisterMode ? "#FFFFFF" : (theme === "dark" ? "#94A3B8" : "#64748B"),
              boxShadow: isRegisterMode ? "0 4px 14px rgba(255, 59, 92, 0.4)" : "none",
              transition: "all 0.25s ease"
            }}
          >
            Register
          </button>
        </div>

        {/* Quick Demo Login Bar matching image */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            color: theme === "dark" ? "#94A3B8" : "#64748B",
            marginBottom: "0.6rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.3rem"
          }}>
            <span>⚡ Quick demo login:</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("ADMIN")}
              style={{
                padding: "0.5rem 0.3rem",
                borderRadius: "10px",
                backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.06)" : "#F8FAFC",
                border: "1px solid",
                borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.12)" : "#CBD5E1",
                color: theme === "dark" ? "#FFFFFF" : "#0F172A",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.3rem"
              }}
            >
              <span>🛡️</span>
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin("RESTAURANT_OWNER")}
              style={{
                padding: "0.5rem 0.3rem",
                borderRadius: "10px",
                backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.06)" : "#F8FAFC",
                border: "1px solid",
                borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.12)" : "#CBD5E1",
                color: theme === "dark" ? "#FFFFFF" : "#0F172A",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.3rem"
              }}
            >
              <span>🏪</span>
              <span>Owner</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin("CUSTOMER")}
              style={{
                padding: "0.5rem 0.3rem",
                borderRadius: "10px",
                backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.06)" : "#F8FAFC",
                border: "1px solid",
                borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.12)" : "#CBD5E1",
                color: theme === "dark" ? "#FFFFFF" : "#0F172A",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.3rem"
              }}
            >
              <span>🧑‍🍳</span>
              <span>Customer</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: "rgba(244, 63, 94, 0.15)",
            color: "#F43F5E",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            padding: "0.75rem 0.85rem",
            borderRadius: "10px",
            fontSize: "0.82rem",
            fontWeight: 600,
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem"
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          {isRegisterMode && (
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: theme === "dark" ? "#CBD5E1" : "#475569", marginBottom: "0.35rem", display: "block" }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="Arun Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.8rem 1rem",
                  borderRadius: "12px",
                  backgroundColor: theme === "dark" ? "rgba(15, 23, 42, 0.7)" : "#F8FAFC",
                  border: "1px solid",
                  borderColor: theme === "dark" ? "#26334D" : "#CBD5E1",
                  color: theme === "dark" ? "#FFFFFF" : "#0F172A",
                  fontSize: "0.92rem",
                  outline: "none"
                }}
              />
            </div>
          )}

          {/* Email Input */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: theme === "dark" ? "#CBD5E1" : "#475569", marginBottom: "0.35rem", display: "block" }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.8rem 1rem",
                borderRadius: "12px",
                backgroundColor: theme === "dark" ? "rgba(15, 23, 42, 0.7)" : "#F8FAFC",
                border: "1px solid",
                borderColor: theme === "dark" ? "#26334D" : "#CBD5E1",
                color: theme === "dark" ? "#FFFFFF" : "#0F172A",
                fontSize: "0.92rem",
                outline: "none"
              }}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: theme === "dark" ? "#CBD5E1" : "#475569", marginBottom: "0.35rem", display: "block" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.8rem 2.6rem 0.8rem 1rem",
                  borderRadius: "12px",
                  backgroundColor: theme === "dark" ? "rgba(15, 23, 42, 0.7)" : "#F8FAFC",
                  border: "1px solid",
                  borderColor: theme === "dark" ? "#26334D" : "#CBD5E1",
                  color: theme === "dark" ? "#FFFFFF" : "#0F172A",
                  fontSize: "0.92rem",
                  outline: "none"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: theme === "dark" ? "#64748B" : "#94A3B8",
                  cursor: "pointer",
                  padding: "0.2rem"
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isRegisterMode && (
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: theme === "dark" ? "#CBD5E1" : "#475569", marginBottom: "0.35rem", display: "block" }}>
                Select Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.8rem 1rem",
                  borderRadius: "12px",
                  backgroundColor: theme === "dark" ? "rgba(15, 23, 42, 0.7)" : "#F8FAFC",
                  border: "1px solid",
                  borderColor: theme === "dark" ? "#26334D" : "#CBD5E1",
                  color: theme === "dark" ? "#FFFFFF" : "#0F172A",
                  fontSize: "0.92rem",
                  fontWeight: 600
                }}
              >
                <option value="CUSTOMER">Customer / Diner</option>
                <option value="RESTAURANT_OWNER">Restaurant Owner</option>
                <option value="ADMIN">Platform Admin</option>
              </select>
            </div>
          )}

          {/* Submit Button matching image style */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.9rem",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #FF3B5C 0%, #FF541E 100%)",
              color: "#FFFFFF",
              border: "none",
              fontSize: "1rem",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(255, 59, 92, 0.4)",
              transition: "transform 0.2s, boxShadow 0.2s"
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            {loading ? "AUTHENTICATING..." : (isRegisterMode ? "Register Account" : "Login to SmartFood")}
          </button>
        </form>
      </div>
    </div>
  );
}