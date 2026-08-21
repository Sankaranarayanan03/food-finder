import { useState, useEffect } from "react";
import { Award, Zap, Clock, TrendingUp } from "lucide-react";
import { api } from "../services/api";

const TIER_ICONS = { Bronze: "🥉", Silver: "🥈", Gold: "🥇", Platinum: "💎" };
const TIER_GRADIENTS = {
  Bronze: "linear-gradient(135deg, #CD7F32 0%, #E8A05A 100%)",
  Silver: "linear-gradient(135deg, #64748B 0%, #94A3B8 100%)",
  Gold: "linear-gradient(135deg, #D97706 0%, #FBBF24 100%)",
  Platinum: "linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)",
};

export function LoyaltyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getLoyalty()
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load loyalty data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Loading loyalty rewards...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "1.5rem", backgroundColor: "#FEF2F2", borderRadius: "var(--radius-lg)", color: "var(--danger)", textAlign: "center" }}>
        {error}
      </div>
    );
  }

  if (!data) return null;

  const tierGrad = TIER_GRADIENTS[data.current_tier?.name] || TIER_GRADIENTS.Bronze;
  const tierIcon = TIER_ICONS[data.current_tier?.name] || "🥉";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Main Tier Card */}
      <div
        style={{
          background: tierGrad,
          borderRadius: "var(--radius-xl)",
          padding: "2rem",
          color: "#FFFFFF",
          position: "relative",
          overflow: "hidden",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: "absolute",
            right: "-40px",
            top: "-40px",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "40px",
            bottom: "-60px",
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.07)",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>{tierIcon}</div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Current Tier
          </div>
          <div style={{ fontSize: "2.25rem", fontWeight: 900, letterSpacing: "-0.03em" }}>
            {data.current_tier?.name} Member
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.75rem" }}>
            <span style={{ fontSize: "2.5rem", fontWeight: 900 }}>{data.total_points}</span>
            <span style={{ fontSize: "1rem", opacity: 0.85 }}>SmartPoints earned</span>
          </div>

          {/* Progress Bar to Next Tier */}
          {data.next_tier && (
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 600, opacity: 0.9, marginBottom: "0.4rem" }}>
                <span>{data.current_tier?.name}</span>
                <span>{TIER_ICONS[data.next_tier?.name]} {data.next_tier?.name} — {data.points_to_next} pts to go</span>
              </div>
              <div
                style={{
                  height: "8px",
                  backgroundColor: "rgba(255,255,255,0.25)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${data.progress_pct}%`,
                    backgroundColor: "#FFFFFF",
                    borderRadius: "4px",
                    transition: "width 1s ease",
                    boxShadow: "0 0 10px rgba(255,255,255,0.6)",
                  }}
                />
              </div>
            </div>
          )}

          {!data.next_tier && (
            <div style={{ marginTop: "1rem", fontSize: "0.85rem", fontWeight: 700, opacity: 0.9 }}>
              🎉 You've reached the highest tier! Enjoy all Platinum perks.
            </div>
          )}
        </div>
      </div>

      {/* Current Tier Perks */}
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
          padding: "1.5rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Award size={18} style={{ color: "var(--primary)" }} />
          Your {data.current_tier?.name} Perks
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {data.current_tier?.perks?.map((perk, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Zap size={11} style={{ color: "var(--primary)" }} />
              </div>
              <span style={{ color: "var(--text-main)", fontWeight: 600 }}>{perk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All Tiers Progress */}
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
          padding: "1.5rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <TrendingUp size={18} style={{ color: "var(--secondary)" }} />
          Tier Progression
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
          {data.tiers?.map((tier) => {
            const isCurrent = tier.name === data.current_tier?.name;
            const isUnlocked = data.total_points >= tier.min;
            return (
              <div
                key={tier.name}
                style={{
                  padding: "1rem",
                  borderRadius: "var(--radius-lg)",
                  border: `2px solid ${isCurrent ? tier.color : isUnlocked ? "var(--secondary)" : "var(--border)"}`,
                  backgroundColor: isCurrent ? `${tier.color}15` : isUnlocked ? "var(--secondary-light)" : "var(--bg-main)",
                  position: "relative",
                }}
              >
                {isCurrent && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-8px",
                      left: "10px",
                      backgroundColor: tier.color,
                      color: "#FFFFFF",
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      padding: "0.1rem 0.4rem",
                      borderRadius: "4px",
                      textTransform: "uppercase",
                    }}
                  >
                    Current
                  </div>
                )}
                <div style={{ fontSize: "1.5rem" }}>{TIER_ICONS[tier.name]}</div>
                <div style={{ fontWeight: 800, fontSize: "0.9rem", marginTop: "0.25rem", color: tier.color }}>{tier.name}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  {tier.name === "Platinum" ? "350+ pts" : `${tier.min}–${tier.max} pts`}
                </div>
                {isUnlocked && (
                  <div style={{ fontSize: "0.65rem", color: "var(--secondary)", fontWeight: 700, marginTop: "0.25rem" }}>✓ Unlocked</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Points History */}
      {data.history?.length > 0 && (
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            padding: "1.5rem",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Clock size={18} style={{ color: "var(--accent)" }} />
            Points History
          </h3>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {data.history.map((h, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 0",
                  borderBottom: i < data.history.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{h.restaurant_name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {h.booking_ref} • {h.earned_at ? new Date(h.earned_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: "0.95rem",
                    color: "var(--secondary)",
                    backgroundColor: "#DEF7EC",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "6px",
                  }}
                >
                  +{h.points} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}