import { useState } from "react";
import { AlertTriangle, X, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../services/api";

export function ComplaintModal({ restaurant, booking, onClose, onComplaintFiled }) {
  const [complaintType, setComplaintType] = useState("Food Quality");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const COMPLAINT_TYPES = [
    "Food Quality & Taste",
    "Service Delay / Staff Conduct",
    "Table Allocation / Seating Issue",
    "Billing & Charges Discrepancy",
    "Cleanliness & Hygiene",
    "Parking Issues"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || description.length < 10) {
      setError("Please describe your issue in at least 10 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.fileComplaint({
        restaurant_id: restaurant.id,
        booking_id: booking?.id || undefined,
        complaint_type: complaintType,
        description: description.trim()
      });
      setSuccess(true);
      onComplaintFiled?.(res);
    } catch (err) {
      setError(err.message || "Failed to submit grievance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "500px", padding: "2rem" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "var(--danger-bg)",
              color: "var(--danger)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>
                Customer Support & Grievance
              </h2>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {restaurant.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <CheckCircle2 size={48} style={{ color: "var(--success)", margin: "0 auto 1rem auto" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 900, marginBottom: "0.3rem" }}>Complaint Registered</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              The restaurant management and platform admins have been notified. You will see their official response in your profile.
            </p>
            <button onClick={onClose} className="btn btn-primary" style={{ width: "100%" }}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                backgroundColor: "var(--danger-bg)",
                color: "var(--danger)",
                padding: "0.75rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.85rem",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.3rem", display: "block" }}>
                GRIEVANCE CATEGORY
              </label>
              <select
                value={complaintType}
                onChange={(e) => setComplaintType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.7rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.9rem",
                  fontWeight: 600
                }}
              >
                {COMPLAINT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.3rem", display: "block" }}>
                DESCRIPTION & DETAILS
              </label>
              <textarea
                rows={4}
                placeholder="Explain what went wrong so the restaurant owner can investigate and respond..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.9rem"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "0.85rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)"
              }}
            >
              {loading ? "SUBMITTING..." : "SUBMIT GRIEVANCE"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}