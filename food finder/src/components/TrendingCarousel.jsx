import { useState, useEffect, useRef } from "react";
import { Star, MapPin, ChevronLeft, ChevronRight, Flame, Utensils } from "lucide-react";
import { api } from "../services/api";

export function TrendingCarousel({ onSelectRestaurant, onBook }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    api.getTrending()
      .then(setRestaurants)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  const getStatusColor = (r) => {
    if (!r.is_open) return { bg: "#FEE2E2", text: "#991B1B", label: "Closed" };
    if (r.table_status === "AVAILABLE") return { bg: "#DEF7EC", text: "#03543F", label: "Open · Tables Ready" };
    if (r.table_status === "LIMITED") return { bg: "#FEF3C7", text: "#92400E", label: "Open · Few Tables" };
    return { bg: "#FEE2E2", text: "#991B1B", label: "Open · Tables Full" };
  };

  if (loading) return null;
  if (!restaurants.length) return null;

  return (
    <section style={{ padding: "2.5rem 0", backgroundColor: "var(--bg-card)" }}>
      <div className="container">
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                backgroundColor: "#FFF7ED",
                color: "#C2410C",
                padding: "0.25rem 0.75rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.75rem",
                fontWeight: 800,
                marginBottom: "0.4rem",
                border: "1px solid #FED7AA",
              }}
            >
              <Flame size={13} />
              <span>TRENDING THIS WEEK</span>
            </div>
            <h2 style={{ fontSize: "1.65rem", fontWeight: 900, color: "var(--text-main)" }}>
              What's Hot in Tamil Nadu 🔥
            </h2>
          </div>

          {/* Navigation arrows */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => scroll(-1)}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "var(--shadow-sm)",
                transition: "var(--transition)",
                color: "var(--text-main)"
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--primary)", e.currentTarget.style.color = "#FFFFFF")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-card)", e.currentTarget.style.color = "var(--text-main)")}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll(1)}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "var(--shadow-sm)",
                transition: "var(--transition)",
                color: "var(--text-main)"
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--primary)", e.currentTarget.style.color = "#FFFFFF")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-card)", e.currentTarget.style.color = "var(--text-main)")}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Row */}
        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: "1rem",
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingBottom: "0.5rem",
          }}
        >
          {restaurants.map((r, idx) => {
            const status = getStatusColor(r);
            return (
              <div
                key={r.id}
                onClick={() => onSelectRestaurant(r)}
                style={{
                  minWidth: "240px",
                  maxWidth: "240px",
                  backgroundColor: "var(--bg-card)",
                  borderRadius: "var(--radius-xl)",
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  cursor: "pointer",
                  boxShadow: "var(--shadow-md)",
                  transition: "var(--transition)",
                  flexShrink: 0,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-xl)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                }}
              >
                {/* Image */}
                <div style={{ position: "relative", height: "150px", overflow: "hidden", backgroundColor: "#E2E8F0" }}>
                  <img
                    src={r.image_url || "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80"}
                    alt={r.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  {/* Rank Badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      padding: "0.2rem 0.55rem",
                      borderRadius: "var(--radius-full)",
                      backgroundColor: idx === 0 ? "#F59E0B" : idx === 1 ? "#64748B" : idx === 2 ? "#B45309" : "rgba(15,23,42,0.8)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontWeight: 900,
                      fontSize: "0.75rem",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
                      border: "1px solid rgba(255,255,255,0.3)"
                    }}
                  >
                    <span>{idx === 0 ? "🥇 TOP 1" : idx === 1 ? "🥈 TOP 2" : idx === 2 ? "🥉 TOP 3" : `#${idx + 1}`}</span>
                  </div>
                  {/* Rating */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "8px",
                      backgroundColor: "rgba(15,23,42,0.85)",
                      backdropFilter: "blur(4px)",
                      color: "#FCD34D",
                      padding: "0.25rem 0.55rem",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.78rem",
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      border: "1px solid rgba(255,255,255,0.15)"
                    }}
                  >
                    <Star size={12} style={{ fill: "#FCD34D" }} />
                    <span>{r.rating}</span>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "1rem" }}>
                  <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.25rem", lineHeight: 1.3, color: "var(--text-main)" }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.6rem" }}>
                    <MapPin size={12} style={{ color: "var(--primary)" }} />
                    <span>{r.city} • {r.cuisine}</span>
                  </div>
                  <div
                    style={{
                      display: "inline-block",
                      backgroundColor: status.bg,
                      color: status.text,
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      padding: "0.25rem 0.6rem",
                      borderRadius: "var(--radius-sm)",
                      marginBottom: "0.85rem",
                    }}
                  >
                    {status.label}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onBook(r); }}
                    className="btn btn-primary btn-sm"
                    style={{
                      width: "100%",
                      fontSize: "0.82rem",
                      fontWeight: 800,
                      borderRadius: "var(--radius-md)",
                      padding: "0.5rem 0.75rem"
                    }}
                  >
                    <Utensils size={13} />
                    <span>Reserve Table</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}