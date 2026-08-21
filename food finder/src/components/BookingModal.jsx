import { useState } from "react";
import confetti from "canvas-confetti";
import { 
  X, Calendar, Clock, Users, Utensils, CheckCircle2, AlertCircle, Copy, Mail, MessageSquare
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { shareBookingToWhatsApp } from "../utils/whatsapp";

export function BookingModal({ restaurant, preOrders = [], onClose, onBookingSuccess }) {
  const { user } = useAuth();
  const todayStr = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState("19:30");
  const [guests, setGuests] = useState(2);
  const [requests, setRequests] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [waPhone, setWaPhone] = useState(user?.phone || "");
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const TIME_SLOTS = [
    "12:00", "12:30", "13:00", "13:30", "14:00", 
    "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
  ];

  const preOrderCount = preOrders.reduce((sum, x) => sum + x.qty, 0);
  const preOrderTotal = preOrders.reduce((sum, x) => sum + (x.qty * x.item.price), 0);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let finalRequests = requests || "";
      if (preOrders.length > 0) {
        const preOrderText = preOrders.map(p => `${p.qty}x ${p.item.name} (₹${p.item.price * p.qty})`).join(", ");
        finalRequests = `[Dine-In Pre-Order: ${preOrderText} | Total: ₹${preOrderTotal}] ${requests ? "• " + requests : ""}`;
      }

      const payload = {
        restaurant_id: restaurant.id,
        booking_date: date,
        booking_time: time,
        guest_count: parseInt(guests),
        special_requests: finalRequests || undefined,
      };

      const result = await api.createBooking(payload);
      setConfirmedBooking(result);
      
      // Trigger festive celebration confetti
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#E05A1B", "#0E5E4E", "#E59500", "#10B981"]
      });

      onBookingSuccess?.(result);
    } catch (err) {
      setError(err.message || "Failed to complete reservation. Please select another slot.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!confirmedBooking?.id) return;
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;

    setCancelling(true);
    try {
      await api.cancelBooking(confirmedBooking.id);
      setCancelled(true);
    } catch (err) {
      alert(err.message || "Could not cancel reservation.");
    } finally {
      setCancelling(false);
    }
  };

  const copyVoucherCode = () => {
    if (confirmedBooking?.verification_code) {
      navigator.clipboard.writeText(confirmedBooking.verification_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ padding: "2rem" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: "0.4rem" }}>
              Instant Table Reservation
            </span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-main)" }}>
              {restaurant.name}
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {restaurant.city} • {restaurant.cuisine} • {restaurant.price_range}
            </p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)", padding: "0.25rem" }}>
            <X size={22} />
          </button>
        </div>

        {/* Confirmation State Voucher */}
        {confirmedBooking ? (
          <div style={{ textAlign: "center", animation: "fadeIn 0.3s ease" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "var(--secondary-light)",
              color: "var(--secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem auto"
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--text-main)", marginBottom: "0.25rem" }}>
              RESERVATION CONFIRMED!
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Your table is secured. Present your 6-digit code upon arrival.
            </p>

            {/* Official 6-Digit Pass Card */}
            <div style={{
              background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
              color: "#FFFFFF",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              textAlign: "left",
              border: "1px solid #334155",
              boxShadow: "var(--shadow-xl)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed #475569", paddingBottom: "0.85rem", marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 700 }}>BOOKING REFERENCE</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--accent)" }}>{confirmedBooking.booking_ref}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 700 }}>ASSIGNED TABLE</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>{confirmedBooking.table_number || "Auto-assigned"}</div>
                </div>
              </div>

              {/* 6-Digit Code Spotlight */}
              <div style={{
                backgroundColor: "rgba(224, 90, 27, 0.2)",
                border: "1.5px solid var(--primary)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                textAlign: "center",
                marginBottom: "1rem"
              }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#FFA07A", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  YOUR 6-DIGIT CHECK-IN CODE
                </div>
                <div style={{
                  fontFamily: "monospace",
                  fontSize: "2.5rem",
                  fontWeight: 900,
                  letterSpacing: "0.3em",
                  color: "#FFFFFF",
                  margin: "0.25rem 0"
                }}>
                  {confirmedBooking.verification_code}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#CBD5E1" }}>
                  Show this to restaurant staff for instant check-in (+10 Loyalty Points)
                </div>
              </div>

              {/* Booking Summary items */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.82rem", color: "#E2E8F0" }}>
                <div><strong>Date:</strong> {confirmedBooking.booking_date}</div>
                <div><strong>Time:</strong> {confirmedBooking.booking_time}</div>
                <div><strong>Guests:</strong> {confirmedBooking.guest_count} Persons</div>
                <div><strong>Status:</strong> {cancelled ? <span style={{ color: "#F87171", fontWeight: 800 }}>CANCELLED</span> : "CONFIRMED"}</div>
              </div>

              {/* Location info notice */}
              {restaurant?.address && (
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #475569", fontSize: "0.78rem", color: "#94A3B8" }}>
                  📍 <strong>Location:</strong> {restaurant.address}, {restaurant.city}
                </div>
              )}

              {/* Check-In Disclaimer Notice on Pass */}
              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #475569", fontSize: "0.78rem", color: "#FEF08A" }}>
                ⏰ <strong>5-Min Arrival Policy:</strong> A 5-minute grace period applies. Please check in on time at {confirmedBooking.booking_time} to prevent automatic table release.
              </div>

              {/* Pre-Order Attached Notice */}
              {preOrderCount > 0 && (
                <div style={{
                  marginTop: "0.75rem",
                  paddingTop: "0.75rem",
                  borderTop: "1px dashed #475569",
                  fontSize: "0.8rem",
                  color: "#FEF08A",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}>
                  <Utensils size={14} />
                  <span><strong>{preOrderCount} Dishes Pre-Ordered (₹{preOrderTotal})</strong> — Kitchen alerted!</span>
                </div>
              )}
            </div>

            {cancelled && (
              <div style={{
                backgroundColor: "#FEF2F2",
                color: "#991B1B",
                padding: "0.85rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.85rem",
                fontWeight: 800,
                textAlign: "center",
                marginBottom: "1.25rem",
                border: "1px solid #FCA5A5"
              }}>
                ✕ RESERVATION CANCELLED SUCCESSFULLY
              </div>
            )}

            {/* Email & Info notices */}
            <div style={{ marginBottom: "1.25rem", textAlign: "left" }}>
              <div style={{
                backgroundColor: "var(--secondary-light)",
                color: "var(--secondary)",
                padding: "0.75rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.82rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <Mail size={16} />
                <span>Confirmation details sent to <strong>{user?.email || "your email"}</strong>.</span>
              </div>
            </div>

            {/* WhatsApp Share Section */}
            {!cancelled && (
              showPhoneInput ? (
                <div style={{
                  backgroundColor: "#F0FDF4",
                  border: "2px solid #25D366",
                  borderRadius: "var(--radius-lg)",
                  padding: "1rem",
                  marginBottom: "1.25rem",
                  textAlign: "left"
                }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 800, color: "#166534", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                    <MessageSquare size={16} />
                    <span>Enter Customer / Mobile Number for WhatsApp Pass:</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210 or 919876543210"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.75rem",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      marginBottom: "0.75rem",
                      border: "1.5px solid #86EFAC"
                    }}
                    autoFocus
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        shareBookingToWhatsApp(confirmedBooking, restaurant, waPhone);
                        setShowPhoneInput(false);
                      }}
                      className="btn"
                      style={{
                        backgroundColor: "#25D366",
                        color: "#FFFFFF",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        padding: "0.65rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.3rem"
                      }}
                    >
                      <MessageSquare size={16} />
                      <span>SEND ON WHATSAPP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPhoneInput(false)}
                      className="btn btn-secondary"
                      style={{ fontSize: "0.85rem", padding: "0.65rem", fontWeight: 700 }}
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <button
                    onClick={() => setShowPhoneInput(true)}
                    className="btn"
                    style={{
                      width: "100%",
                      fontWeight: 800,
                      backgroundColor: "#25D366",
                      color: "#FFFFFF",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)",
                      padding: "0.8rem"
                    }}
                  >
                    <MessageSquare size={18} />
                    <span>SHARE CODE & LOCATION TO WHATSAPP</span>
                  </button>
                </div>
              )
            )}

            {/* Additional Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
              <button
                onClick={copyVoucherCode}
                className="btn btn-secondary"
                style={{ width: "100%", fontWeight: 700, fontSize: "0.78rem", padding: "0.6rem 0.2rem" }}
              >
                <Copy size={13} />
                <span>{copied ? "COPIED" : "COPY"}</span>
              </button>

              {!cancelled ? (
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="btn btn-secondary"
                  style={{ width: "100%", fontWeight: 700, fontSize: "0.78rem", color: "var(--danger)", borderColor: "#FCA5A5", padding: "0.6rem 0.2rem" }}
                >
                  <span>{cancelling ? "CANCELING..." : "CANCEL BOOKING"}</span>
                </button>
              ) : (
                <div></div>
              )}
              
              <button
                onClick={onClose}
                className="btn btn-primary"
                style={{ width: "100%", fontWeight: 700, fontSize: "0.78rem", padding: "0.6rem 0.2rem" }}
              >
                <span>DONE</span>
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleBookingSubmit}>
            {error && (
              <div style={{
                backgroundColor: "var(--danger-bg)",
                color: "var(--danger)",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.85rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1.25rem"
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Date Selection */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                <Calendar size={15} style={{ color: "var(--primary)" }} />
                <span>SELECT DATE</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                  fontSize: "0.95rem"
                }}
              />
            </div>

            {/* Time Slots Grid */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                <Clock size={15} style={{ color: "var(--accent)" }} />
                <span>SELECT TIME SLOT</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "0.4rem" }}>
                {TIME_SLOTS.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setTime(t)}
                    style={{
                      padding: "0.55rem 0.25rem",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      border: "1.5px solid",
                      borderColor: time === t ? "var(--primary)" : "var(--border)",
                      backgroundColor: time === t ? "var(--primary)" : "var(--bg-main)",
                      color: time === t ? "#FFFFFF" : "var(--text-main)",
                      boxShadow: time === t ? "0 4px 12px rgba(255, 84, 30, 0.3)" : "none",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Guests */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                <Users size={15} style={{ color: "var(--secondary)" }} />
                <span>NUMBER OF GUESTS</span>
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                  fontSize: "0.95rem"
                }}
              >
                <option value={1}>1 Guest (Single Diner)</option>
                <option value={2}>2 Guests (Table for Two)</option>
                <option value={3}>3 Guests</option>
                <option value={4}>4 Guests (Standard Table)</option>
                <option value={5}>5 Guests</option>
                <option value={6}>6 Guests (Family Table)</option>
                <option value={8}>8+ Guests (Large Party)</option>
              </select>
            </div>

            {/* Dine-In Pre-Ordered Dishes Card (Feature 4) */}
            {preOrders.length > 0 && (
              <div style={{
                backgroundColor: "var(--primary-light)",
                border: "1.5px solid var(--primary)",
                borderRadius: "var(--radius-md)",
                padding: "0.85rem 1rem",
                marginBottom: "1.25rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.88rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Utensils size={14} />
                    <span>Pre-Ordered Dishes ({preOrderCount})</span>
                  </span>
                  <span style={{ fontWeight: 900, color: "var(--primary)", fontSize: "0.95rem" }}>
                    ₹{preOrderTotal}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {preOrders.map((p) => (
                    <div key={p.item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-main)" }}>
                      <span>{p.qty}x {p.item.name}</span>
                      <span style={{ fontWeight: 700 }}>₹{p.item.price * p.qty}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.4rem", borderTop: "1px dashed rgba(224,90,27,0.3)", paddingTop: "0.3rem" }}>
                  ⚡ Food will be served hot immediately when you arrive.
                </div>
              </div>
            )}

            {/* Special Requests */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.3rem", display: "block" }}>
                SPECIAL REQUESTS (OPTIONAL)
              </label>
              <input
                type="text"
                placeholder="e.g. High chair needed, quiet booth, celebrating birthday"
                value={requests}
                onChange={(e) => setRequests(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.85rem"
                }}
              />
            </div>
            {/* 5-Minute Grace Period Check-In Disclaimer */}
            <div style={{
              backgroundColor: "#FEF3C7",
              border: "1.5px solid #F59E0B",
              borderRadius: "var(--radius-md)",
              padding: "0.85rem 1rem",
              marginBottom: "1.5rem",
              textAlign: "left"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 800, fontSize: "0.82rem", color: "#92400E", marginBottom: "0.3rem" }}>
                <AlertCircle size={16} style={{ color: "#D97706" }} />
                <span>IMPORTANT CHECK-IN DISCLAIMER & POLICY</span>
              </div>
              <p style={{ fontSize: "0.78rem", color: "#78350F", margin: 0, lineHeight: 1.45, fontWeight: 600 }}>
                ⏰ <strong>5-Minute Arrival Grace Period:</strong> Please arrive on time at the restaurant. A maximum of <strong>5 minutes</strong> grace period is provided after your reserved time slot (<strong>{time}</strong>). If check-in is not completed within 5 minutes, your table reservation will automatically be cancelled and made available to other waiting diners.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "0.9rem",
                fontSize: "1rem",
                fontWeight: 800,
                borderRadius: "var(--radius-lg)"
              }}
            >
              <Utensils size={18} />
              <span>{loading ? "CHECKING AVAILABILITY & LOCKING TABLE..." : "CONFIRM RESERVATION"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}