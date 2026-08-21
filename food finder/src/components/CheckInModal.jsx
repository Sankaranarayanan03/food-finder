import { useState } from "react";
import confetti from "canvas-confetti";
import { 
  ShieldCheck, X, CheckCircle2, AlertCircle, Award
} from "lucide-react";
import { api } from "../services/api";

export function CheckInModal({ onClose, onCheckInSuccess }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await api.verifyCheckInCode(code.trim());
      setSuccessData(res);

      // Trigger Confetti
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#10B981", "#0E5E4E", "#E59500"]
      });

      onCheckInSuccess?.(res);
    } catch (err) {
      setError(err.message || "Invalid or expired check-in code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "480px", padding: "2rem" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "var(--secondary)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>
                Owner Check-In Terminal
              </h2>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Verify 6-digit customer reservation code
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        {successData ? (
          <div style={{ textAlign: "center", animation: "fadeIn 0.3s ease" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "var(--secondary-light)",
              color: "var(--secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem auto"
            }}>
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--secondary)", marginBottom: "0.25rem" }}>
              {successData.message || "✓ CUSTOMER VERIFIED — ✓ CHECK-IN SUCCESSFUL"}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Guest arrived and verified. Table status updated to CHECKED_IN.
            </p>

            {/* Visit Details Card */}
            <div style={{
              backgroundColor: "var(--bg-main)",
              borderRadius: "var(--radius-lg)",
              padding: "1.25rem",
              border: "1px solid var(--border)",
              textAlign: "left",
              marginBottom: "1.25rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Booking Ref:</span>
                <strong style={{ color: "var(--primary)" }}>{successData.booking_ref}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Guest Name:</span>
                <strong>{successData.customer_name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Party Size:</span>
                <strong>{successData.guest_count} Persons</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Reservation Time:</span>
                <strong>{successData.booking_time}</strong>
              </div>

              <div style={{
                marginTop: "0.75rem",
                paddingTop: "0.75rem",
                borderTop: "1px dashed var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "var(--accent)"
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 700, fontSize: "0.85rem" }}>
                  <Award size={16} />
                  <span>Loyalty Awarded:</span>
                </span>
                <strong style={{ fontSize: "1rem" }}>+{successData.points_awarded} Points</strong>
              </div>
            </div>

            <button
              onClick={() => { setSuccessData(null); setCode(""); }}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              Verify Next Code
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerify}>
            {error && (
              <div style={{
                backgroundColor: "var(--danger-bg)",
                color: "var(--danger)",
                padding: "0.75rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem"
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.5rem", display: "block" }}>
                ENTER 6-DIGIT CODE
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 583214"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                style={{
                  width: "100%",
                  textAlign: "center",
                  fontSize: "2rem",
                  fontWeight: 900,
                  letterSpacing: "0.3em",
                  fontFamily: "monospace",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)"
                }}
                autoFocus
              />
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
                <span>📲 Accepts 6-digit codes presented by diner in-person or via WhatsApp message</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "0.85rem",
                fontSize: "0.95rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #0E5E4E 0%, #10B981 100%)"
              }}
            >
              <ShieldCheck size={18} />
              <span>{loading ? "VERIFYING..." : "VERIFY & CHECK IN"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}