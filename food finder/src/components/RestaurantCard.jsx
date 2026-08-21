import { 
  Star, MapPin, Clock, Car, Utensils, Heart, 
  Navigation, ShieldCheck
} from "lucide-react";
import { useRealtime } from "../context/RealtimeContext";

export function RestaurantCard({ 
  restaurant, 
  onSelect, 
  onBook, 
  onDirections, 
  isFavorite = false,
  onToggleFavorite,
  isSelected = false
}) {
  const { liveUpdates } = useRealtime();

  // Merge real-time updates if available
  const live = liveUpdates[restaurant.id];
  const isOpen = live?.is_open !== undefined ? live.is_open : restaurant.is_open;
  const tableStatus = live?.table_status || restaurant.table_status;
  const parkingStatus = live?.parking_status || restaurant.parking_status;
  const waitTime = live?.wait_time_mins !== undefined ? live.wait_time_mins : restaurant.wait_time_mins;

  const getTableBadge = () => {
    if (!isOpen) return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.3rem 0.75rem",
        borderRadius: "var(--radius-full)",
        fontSize: "0.75rem",
        fontWeight: 800,
        backgroundColor: "rgba(15, 23, 42, 0.85)",
        color: "#94A3B8",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,255,255,0.15)"
      }}>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#94A3B8" }} />
        <span>Closed</span>
      </span>
    );

    if (tableStatus === "AVAILABLE") return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.3rem 0.75rem",
        borderRadius: "var(--radius-full)",
        fontSize: "0.75rem",
        fontWeight: 800,
        backgroundColor: "rgba(6, 78, 59, 0.9)",
        color: "#6EE7B7",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(16, 185, 129, 0.4)",
        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)"
      }}>
        <span className="pulse-dot pulse-green" style={{ width: "7px", height: "7px" }} />
        <span>Tables Ready</span>
      </span>
    );

    if (tableStatus === "LIMITED") return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.3rem 0.75rem",
        borderRadius: "var(--radius-full)",
        fontSize: "0.75rem",
        fontWeight: 800,
        backgroundColor: "rgba(120, 53, 15, 0.9)",
        color: "#FDE68A",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(245, 158, 11, 0.4)"
      }}>
        <span className="pulse-dot pulse-yellow" style={{ width: "7px", height: "7px" }} />
        <span>Few Tables Left</span>
      </span>
    );

    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.3rem 0.75rem",
        borderRadius: "var(--radius-full)",
        fontSize: "0.75rem",
        fontWeight: 800,
        backgroundColor: "rgba(136, 19, 55, 0.9)",
        color: "#FECDD3",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(244, 63, 94, 0.4)"
      }}>
        <span className="pulse-dot pulse-red" style={{ width: "7px", height: "7px" }} />
        <span>Tables Full</span>
      </span>
    );
  };

  const getParkingBadge = () => {
    if (parkingStatus === "AVAILABLE") return <span style={{ color: "var(--success)", fontWeight: 700 }}>Parking Free</span>;
    if (parkingStatus === "LIMITED") return <span style={{ color: "var(--warning)", fontWeight: 700 }}>Valet / Limited</span>;
    return <span style={{ color: "var(--danger)", fontWeight: 700 }}>No Parking</span>;
  };

  return (
    <div
      onClick={() => onSelect?.(restaurant)}
      style={{
        backgroundColor: "var(--bg-card)",
        borderRadius: "var(--radius-xl)",
        border: isSelected ? "2.5px solid var(--primary)" : "1.5px solid var(--border)",
        boxShadow: isSelected ? "0 8px 24px rgba(255, 84, 30, 0.25)" : "var(--shadow-md)",
        overflow: "hidden",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        cursor: "pointer"
      }}
      onMouseOver={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "var(--shadow-xl)";
          e.currentTarget.style.borderColor = "var(--primary)";
        }
      }}
      onMouseOut={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "var(--shadow-md)";
          e.currentTarget.style.borderColor = "var(--border)";
        }
      }}
    >
      {/* Image Container */}
      <div style={{ position: "relative", height: "205px", width: "100%", overflow: "hidden", backgroundColor: "#E2E8F0" }}>
        <img
          src={restaurant.image_url || "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80"}
          alt={restaurant.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />

        {/* Favorite Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(restaurant.id); }}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "var(--bg-card)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            zIndex: 2,
            border: "1px solid var(--border)",
            transition: "transform 0.2s"
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Heart
            size={18}
            style={{
              color: isFavorite ? "var(--danger)" : "var(--text-muted)",
              fill: isFavorite ? "var(--danger)" : "transparent"
            }}
          />
        </button>

        {/* Live Table Availability Status Badge */}
        <div style={{ position: "absolute", bottom: "12px", left: "12px", zIndex: 2 }}>
          {getTableBadge()}
        </div>

        {/* Price & Cuisine Floating Tag */}
        <div style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(8px)",
          color: "#FFFFFF",
          padding: "0.3rem 0.75rem",
          borderRadius: "var(--radius-full)",
          fontSize: "0.75rem",
          fontWeight: 800,
          zIndex: 2,
          border: "1px solid rgba(255,255,255,0.2)"
        }}>
          {restaurant.cuisine} • {restaurant.price_range}
        </div>

        {/* Selected Map Tracking Badge */}
        {isSelected && (
          <div style={{
            position: "absolute",
            top: "12px",
            right: "56px",
            backgroundColor: "#FF541E",
            color: "#FFFFFF",
            padding: "0.3rem 0.75rem",
            borderRadius: "var(--radius-full)",
            fontSize: "0.72rem",
            fontWeight: 900,
            zIndex: 3,
            boxShadow: "0 4px 12px rgba(255,84,30,0.5)",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem"
          }}>
            <Navigation size={13} />
            <span>LIVE ROUTE TRACKED</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Name & Rating */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.4rem" }}>
          <h3 
            onClick={(e) => { e.stopPropagation(); onSelect(restaurant); }}
            style={{
              fontSize: "1.2rem",
              fontWeight: 800,
              color: "var(--text-main)",
              cursor: "pointer",
              lineHeight: 1.3,
              transition: "color 0.2s"
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--primary)")}
            onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-main)")}
          >
            {restaurant.name}
          </h3>
          
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            backgroundColor: "#FEF3C7",
            color: "#92400E",
            padding: "0.25rem 0.55rem",
            borderRadius: "8px",
            fontWeight: 900,
            fontSize: "0.85rem",
            boxShadow: "0 1px 3px rgba(245, 158, 11, 0.2)"
          }}>
            <Star size={13} style={{ fill: "#F59E0B", color: "#F59E0B" }} />
            <span>{restaurant.rating}</span>
          </div>
        </div>

        {/* Location & Distance */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
          <MapPin size={14} style={{ color: "var(--primary)" }} />
          <span>{restaurant.city}</span>
          {restaurant.distance_km !== undefined && (
            <>
              <span>•</span>
              <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{restaurant.distance_km} km</span>
              <span>({restaurant.travel_time_mins || 15} mins away)</span>
            </>
          )}
        </div>

        {/* EazyDiner & OpenTable Live Prime Deal & Urgency Ticker */}
        <div style={{
          backgroundColor: "#FFFBEB",
          border: "1px solid #FCD34D",
          borderRadius: "var(--radius-md)",
          padding: "0.4rem 0.65rem",
          fontSize: "0.76rem",
          fontWeight: 700,
          color: "#92400E",
          marginBottom: "0.85rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span>🎁</span>
            <span>EazyDiner Prime: <strong>Flat 25% OFF Bill</strong></span>
          </span>
          <span style={{ color: "#D97706", fontWeight: 800 }}>🔥 14 Booked Today</span>
        </div>

        {/* Live Status Indicators */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
          backgroundColor: "var(--bg-main)",
          padding: "0.65rem 0.85rem",
          borderRadius: "var(--radius-lg)",
          fontSize: "0.78rem",
          marginBottom: "1rem",
          border: "1px solid var(--border)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Clock size={14} style={{ color: "var(--accent)" }} />
            <span>Wait: <strong>{waitTime} mins</strong></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Car size={14} style={{ color: "var(--secondary)" }} />
            <span>{getParkingBadge()}</span>
          </div>
        </div>

        {/* Cost & Verification Notice */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
          <span>Avg <strong>₹{restaurant.avg_cost_for_two}</strong> for two</span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--secondary)", fontWeight: 700, backgroundColor: "var(--secondary-light)", padding: "0.15rem 0.45rem", borderRadius: "4px" }}>
            <ShieldCheck size={14} />
            <span>6-Digit Verified</span>
          </span>
        </div>

        {/* EazyDiner Pay Savings Calculator Tag */}
        <div style={{
          backgroundColor: "#ECFDF5",
          border: "1px solid #A7F3D0",
          color: "#065F46",
          padding: "0.4rem 0.65rem",
          borderRadius: "var(--radius-md)",
          fontSize: "0.76rem",
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem"
        }}>
          <span>💰 Est. Bill: ₹{restaurant.avg_cost_for_two}</span>
          <span style={{ color: "#059669", backgroundColor: "#D1FAE5", padding: "0.15rem 0.45rem", borderRadius: "var(--radius-full)" }}>
            Save ₹{Math.round(restaurant.avg_cost_for_two * 0.25)} with Prime
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem", marginTop: "auto" }}>
          <button
            onClick={(e) => { e.stopPropagation(); onBook(restaurant); }}
            className="btn btn-primary"
            style={{
              width: "100%",
              fontSize: "0.88rem",
              padding: "0.65rem 0.85rem",
              borderRadius: "var(--radius-lg)",
              fontWeight: 800,
              letterSpacing: "0.02em"
            }}
          >
            <Utensils size={15} />
            <span>RESERVE TABLE</span>
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); onDirections(restaurant); }}
            className="btn btn-secondary"
            title="Track Route & Navigation"
            style={{ padding: "0.65rem 0.85rem", color: "var(--secondary)", borderRadius: "var(--radius-lg)" }}
          >
            <Navigation size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}