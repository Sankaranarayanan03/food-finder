import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../context/RealtimeContext";
import { useTheme } from "../context/ThemeContext";
import { 
  Utensils, MapPin, Sparkles, User, LogOut, Shield, 
  Store, Bell,
  Sun, Moon
} from "lucide-react";

export function Navbar({ onNavigate, currentView, selectedCity, onSelectCity, onOpenAI }) {
  const { user, logout, isOwner, isAdmin } = useAuth();
  const { notification } = useRealtime();
  const { theme, toggleTheme } = useTheme();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close role dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowRoleDropdown(false);
      }
    }
    if (showRoleDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showRoleDropdown]);

  const CITIES = [
    "All Cities", "Chennai", "Coimbatore", "Madurai", "Salem", "Erode", 
    "Tiruchirappalli", "Tirunelveli", "Thanjavur", "Dindigul", "Ooty", 
    "Tiruppur", "Thoothukudi", "Vellore", "Hosur", "Kanchipuram"
  ];

  return (
    <>
      {/* EazyDiner Prime Top Announcement Ticker */}
      <div style={{
        background: "linear-gradient(90deg, #0F172A 0%, #1E1B4B 50%, #0D9488 100%)",
        color: "#FFFFFF",
        padding: "0.35rem 1rem",
        fontSize: "0.75rem",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.8rem",
        letterSpacing: "0.02em",
        textAlign: "center"
      }}>
        <span>👑 <strong>EAZYDINER PRIME:</strong> Up to 50% OFF on 35+ Tamil Nadu Spots</span>
        <span style={{ opacity: 0.5 }}>•</span>
        <span>⚡ 1,420 Tables Locked Today</span>
        <span style={{ opacity: 0.5 }}>•</span>
        <span>🔑 Instant 6-Digit WhatsApp Pass</span>
      </div>

      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "var(--bg-card)",
        opacity: 0.98,
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)"
      }}>
      {/* Live notification pill */}
      {notification && (
        <div style={{
          backgroundColor: "var(--secondary)",
          color: "#FFFFFF",
          padding: "0.4rem 1rem",
          fontSize: "0.82rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          animation: "fadeIn 0.3s ease"
        }}>
          <Bell size={14} className="pulse-dot pulse-green" />
          <span>{notification.title}: {notification.message}</span>
        </div>
      )}

      <div className="container" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "72px",
        gap: "1rem"
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate("home")} 
          style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
        >
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, var(--primary) 0%, #D84E10 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            boxShadow: "0 4px 10px rgba(224, 90, 27, 0.3)"
          }}>
            <Utensils size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.25rem", color: "var(--text-main)", letterSpacing: "-0.03em" }}>
                Smart<span style={{ color: "var(--primary)" }}>Finder</span>
              </span>
              <span style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                backgroundColor: "var(--primary-light)",
                color: "var(--primary)",
                padding: "0.15rem 0.4rem",
                borderRadius: "4px",
                textTransform: "uppercase"
              }}>TN Edition</span>
            </div>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 500 }}>
              Tamil Nadu Restaurant Discovery
            </p>
          </div>
        </div>

        {/* City Selector (Customer Only - Hidden for Owner & Admin) */}
        {!isOwner && !isAdmin && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            backgroundColor: "var(--bg-main)",
            padding: "0.45rem 0.9rem",
            borderRadius: "var(--radius-full)",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "var(--text-main)",
            border: "1.5px solid var(--border)",
            boxShadow: "var(--shadow-sm)"
          }}>
            <MapPin size={16} style={{ color: "var(--primary)" }} />
            <select 
              value={selectedCity} 
              onChange={(e) => onSelectCity(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "var(--text-main)",
                cursor: "pointer",
                paddingRight: "0.25rem",
                outline: "none"
              }}
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* EazyPoints & AI Search CTA (Customer Only - Hidden for Owner & Admin) */}
          {!isOwner && !isAdmin && (
            <>
              <button 
                onClick={() => onNavigate("profile")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.45rem 0.8rem",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "#FEF3C7",
                  color: "#92400E",
                  border: "1px solid #FCD34D",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(245, 158, 11, 0.2)"
                }}
                title="View EazyPoints & VIP Loyalty Status"
              >
                <span>🏆</span>
                <span>1,250 EazyPoints</span>
              </button>

              <button 
                onClick={onOpenAI}
                className="btn btn-primary"
                style={{
                  borderRadius: "var(--radius-full)",
                  padding: "0.55rem 1.1rem",
                  fontSize: "0.85rem",
                  background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                  fontWeight: 800,
                  letterSpacing: "0.02em"
                }}
              >
                <Sparkles size={16} />
                <span>AI Food Match</span>
              </button>
            </>
          )}

          {/* Quick Nav Links (Explore - Hidden for Owner & Admin) */}
          {!isOwner && !isAdmin && (
            <button 
              onClick={() => onNavigate("search")}
              className="btn btn-secondary btn-sm"
              style={{
                fontWeight: 700,
                borderRadius: "var(--radius-full)",
                backgroundColor: currentView === "search" ? "var(--primary-light)" : "transparent",
                color: currentView === "search" ? "var(--primary)" : "var(--text-main)",
                borderColor: currentView === "search" ? "var(--primary)" : "var(--border)"
              }}
            >
              Explore
            </button>
          )}

          {/* Show Login button only if user is NOT logged in */}
          {!user && (
            <button 
              onClick={() => onNavigate("login")}
              className="btn btn-secondary btn-sm"
              style={{
                fontWeight: 700,
                borderRadius: "var(--radius-full)",
                backgroundColor: currentView === "login" ? "var(--primary-light)" : "transparent",
                color: currentView === "login" ? "var(--primary)" : "var(--text-main)",
                borderColor: currentView === "login" ? "var(--primary)" : "var(--border)"
              }}
            >
              Login
            </button>
          )}

          {/* Theme Toggle (Feature 6: Dark / Light Mode) */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-sm"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              padding: "0.45rem 0.75rem",
              borderRadius: "var(--radius-full)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              color: theme === "dark" ? "#F59E0B" : "var(--text-main)",
              backgroundColor: theme === "dark" ? "rgba(245, 158, 11, 0.15)" : "var(--bg-main)",
              border: "1.5px solid",
              borderColor: theme === "dark" ? "rgba(245, 158, 11, 0.4)" : "var(--border)",
              boxShadow: theme === "dark" ? "0 0 12px rgba(245, 158, 11, 0.25)" : "none",
              cursor: "pointer"
            }}
          >
            {theme === "dark" ? <Sun size={15} style={{ color: "#F59E0B" }} /> : <Moon size={15} style={{ color: "#475569" }} />}
            <span style={{ fontSize: "0.75rem", fontWeight: 800 }}>{theme === "dark" ? "LIGHT" : "DARK"}</span>
          </button>

          {/* User Nav link */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {isOwner ? (
                <button 
                  onClick={() => onNavigate("owner")}
                  className="btn btn-dark btn-sm"
                  style={{ fontWeight: 600 }}
                >
                  <Store size={15} />
                  <span>Owner Portal</span>
                </button>
              ) : isAdmin ? (
                <button 
                  onClick={() => onNavigate("admin")}
                  className="btn btn-dark btn-sm"
                  style={{ fontWeight: 600 }}
                >
                  <Shield size={15} />
                  <span>Admin Portal</span>
                </button>
              ) : (
                <button 
                  onClick={() => onNavigate("profile")}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 600 }}
                >
                  <User size={15} />
                  <span>My Profile</span>
                </button>
              )}

              <button
                onClick={() => { logout(); onNavigate("login"); }}
                className="btn btn-secondary btn-sm"
                title="Log Out of Current Account"
                style={{ padding: "0.4rem 0.6rem", color: "var(--danger)" }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  </>
  );
}