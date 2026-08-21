import { useState } from "react";
import { Users, Clock, X, AlertCircle } from "lucide-react";
import { api } from "../services/api";

export function WaitlistModal({ restaurant, onClose, onWaitlistJoined }) {
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState("20:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [entry, setEntry] = useState(null);

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.joinWaitlist({
        restaurant_id: restaurant.id,
        guest_count: parseInt(guests),
        preferred_time: time
      });
      setEntry(res);
      onWaitlistJoined?.(res);
    } catch (err) {
      setError(err.message || "Failed to join waitlist queue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "460px", padding: "2rem" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <span className="badge badge-limited" style={{ marginBottom: "0.3rem" }}>
              Live Queue Tracker
            </span>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900 }}>
              Join Live Waitlist
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {restaurant.name} ({restaurant.city})
            </p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        {entry ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem auto",
              fontSize: "1.75rem",
              fontWeight: 900
            }}>
              #{entry.queue_position}
            </div>

            <h3 style={{ fontSize: "1.25rem", fontWeight: 900, marginBottom: "0.25rem" }}>
              YOU ARE #{entry.queue_position} IN LINE!
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              We will notify you immediately once your table for {entry.guest_count} guests is ready.
            </p>

            <button onClick={onClose} className="btn btn-primary" style={{ width: "100%" }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleJoin}>
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
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Users size={14} style={{ color: "var(--primary)" }} />
                <span>PARTY SIZE</span>
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
                <option value={1}>1 Guest</option>
                <option value={2}>2 Guests</option>
                <option value={3}>3 Guests</option>
                <option value={4}>4 Guests</option>
                <option value={6}>6+ Guests</option>
              </select>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Clock size={14} style={{ color: "var(--accent)" }} />
                <span>ESTIMATED ARRIVAL TIME</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
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

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "0.85rem",
                fontWeight: 800,
                fontSize: "0.95rem"
              }}
            >
              {loading ? "JOINING..." : "ENTER LIVE WAITLIST QUEUE"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}