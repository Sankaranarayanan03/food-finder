import { useState } from "react";
import { Search, MapPin, Utensils, Calendar, Clock, Users, Sparkles, ArrowRight, Navigation } from "lucide-react";

export function HeroSearch({ 
  onSearch, 
  onOpenAI, 
  cities = [],
  initialCity = "Chennai"
}) {
  const todayStr = new Date().toISOString().split("T")[0];
  
  const [city, setCity] = useState(initialCity || "Chennai");
  const [cuisine] = useState("");
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState("19:30");
  const [guests, setGuests] = useState(2);
  const [keyword, setKeyword] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoSuccess, setGeoSuccess] = useState(false);
  const [setGeoError] = useState(null);

  const QUICK_AI_PROMPTS = [
    "Vegetarian restaurant in Coimbatore under ₹500 with parking",
    "Fiery Chettinad Pepper Chicken in Chennai with available table",
    "Authentic Madurai Kari Dosa & Bun Parotta under ₹600",
    "Best Biryani in Dindigul within 5 km radius",
    "Traditional Banana Leaf Meals in Tirunelveli"
  ];

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        setGeoSuccess(true);
        const { latitude, longitude } = pos.coords;
        onSearch({
          user_lat: latitude,
          user_lng: longitude,
          sort_by: "distance",
          search: keyword,
          date,
          time,
          guests
        });
      },
      () => {
        setGeoLoading(false);
        setGeoError("Location permission denied. Showing nearest Chennai spots.");
        onSearch({
          user_lat: 13.0827,
          user_lng: 80.2707,
          sort_by: "distance",
          search: keyword,
          date,
          time,
          guests
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch({
      city: city === "All Cities" ? "" : city,
      cuisine: cuisine === "All Cuisines" ? "" : cuisine,
      search: keyword,
      date,
      time,
      guests
    });
  };

  return (
    <div style={{
      position: "relative",
      background: "var(--gradient-hero)",
      color: "#FFFFFF",
      padding: "4.5rem 0 4.25rem 0",
      overflow: "hidden"
    }}>
      {/* Decorative Glowing Orbs */}
      <div style={{
        position: "absolute",
        top: "-15%",
        right: "-8%",
        width: "450px",
        height: "450px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255, 84, 30, 0.28) 0%, rgba(255, 84, 30, 0) 70%)",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute",
        bottom: "-20%",
        left: "-10%",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(13, 148, 136, 0.22) 0%, rgba(13, 148, 136, 0) 70%)",
        pointerEvents: "none"
      }} />

      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        {/* Headline */}
        <div style={{ maxWidth: "860px", textAlign: "center", margin: "0 auto 2.5rem auto" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "rgba(255, 84, 30, 0.15)",
            border: "1.5px solid rgba(255, 84, 30, 0.45)",
            color: "#FF8C5A",
            padding: "0.4rem 1.1rem",
            borderRadius: "var(--radius-full)",
            fontSize: "0.85rem",
            fontWeight: 800,
            marginBottom: "1.25rem",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 15px rgba(255, 84, 30, 0.2)"
          }}>
            <Sparkles size={16} style={{ color: "#F59E0B" }} />
            <span>Smart Real-Time Dining Across 15 Tamil Nadu Cities</span>
          </div>

          <h1 style={{
            fontSize: "clamp(2.2rem, 5.5vw, 3.5rem)",
            fontWeight: 900,
            lineHeight: 1.15,
            color: "#FFFFFF",
            marginBottom: "1.1rem",
            letterSpacing: "-0.03em"
          }}>
            Taste the Soul of <span style={{
              background: "linear-gradient(135deg, #FF7A45 0%, #FF541E 50%, #F59E0B 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 2px 10px rgba(255, 84, 30, 0.4))"
            }}>Tamil Nadu</span>
          </h1>

          <p style={{
            fontSize: "1.1rem",
            color: "#E2E8F0",
            lineHeight: 1.6,
            maxWidth: "680px",
            margin: "0 auto 1.5rem auto",
            fontWeight: 500
          }}>
            Live table availability, instant pre-orders, verified check-ins & smart loyalty rewards.
          </p>

          {/* Quick Category Shortcut Pills */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "0.5rem"
          }}>
            {[
              { label: "🥣 Breakfast", search: "Breakfast" },
              { label: "🍛 Lunch", search: "Lunch" },
              { label: "🥘 Dinner", search: "Dinner" },
              { label: "📍 GPS Nearby", isGps: true },
              { label: "⭐ Top Rated", query: { min_rating: 4.5 } },
              { label: "🌶️ Chettinad", query: { cuisine: "Chettinad" } },
              { label: "🥗 Pure Veg", query: { cuisine: "Vegetarian" } }
            ].map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (p.isGps) {
                    handleDetectLocation();
                  } else if (p.search) {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          onSearch({ search: p.search, user_lat: pos.coords.latitude, user_lng: pos.coords.longitude, sort_by: "distance" });
                        },
                        () => {
                          onSearch({ search: p.search, user_lat: 13.0827, user_lng: 80.2707, sort_by: "distance" });
                        }
                      );
                    } else {
                      onSearch({ search: p.search });
                    }
                  } else {
                    onSearch(p.query);
                  }
                }}
                style={{
                  padding: "0.38rem 0.95rem",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  border: "1.5px solid rgba(255, 255, 255, 0.25)",
                  color: "#FFFFFF",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  transition: "var(--transition)",
                  cursor: "pointer",
                  backdropFilter: "blur(6px)"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary)";
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Box Bar */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          padding: "1.25rem",
          boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.4)",
          maxWidth: "1050px",
          margin: "0 auto",
          color: "var(--text-main)",
          border: "1.5px solid var(--border)"
        }}>
          <form onSubmit={handleSearchSubmit} style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr)) 180px",
            gap: "0.85rem",
            alignItems: "center"
          }}>
            {/* City & GPS Detect */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid var(--border)",
              paddingRight: "0.5rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <MapPin size={13} style={{ color: "var(--primary)" }} />
                  <span>LOCATION</span>
                </label>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={geoLoading}
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    color: geoSuccess ? "#059669" : "var(--primary)",
                    backgroundColor: geoSuccess ? "#D1FAE5" : "var(--primary-light)",
                    padding: "0.15rem 0.45rem",
                    borderRadius: "var(--radius-full)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.2rem"
                  }}
                  title="Detect my current location using GPS"
                >
                  <Navigation size={11} className={geoLoading ? "pulse-dot" : ""} />
                  <span>{geoLoading ? "GPS..." : (geoSuccess ? "NEARBY ✓" : "GPS NEARBY")}</span>
                </button>
              </div>

              <select
                value={city}
                onChange={(e) => { setCity(e.target.value); setGeoSuccess(false); }}
                style={{
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  color: "var(--text-main)",
                  marginTop: "0.25rem",
                  cursor: "pointer",
                  background: "transparent"
                }}
              >
                <option value="All Cities">All Tamil Nadu</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Cuisine or Name Search */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid var(--border)",
              paddingRight: "0.5rem"
            }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Utensils size={13} style={{ color: "var(--secondary)" }} />
                <span>CUISINE / DISH</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Chettinad, Dosa"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  marginTop: "0.25rem",
                  background: "transparent",
                  color: "var(--text-main)"
                }}
              />
            </div>

            {/* Date */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid var(--border)",
              paddingRight: "0.5rem"
            }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Calendar size={13} style={{ color: "var(--primary)" }} />
                <span>DATE</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  marginTop: "0.25rem",
                  background: "transparent",
                  color: "var(--text-main)"
                }}
              />
            </div>

            {/* Time */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid var(--border)",
              paddingRight: "0.5rem"
            }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Clock size={13} style={{ color: "var(--accent)" }} />
                <span>TIME</span>
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  marginTop: "0.25rem",
                  background: "transparent",
                  cursor: "pointer"
                }}
              >
                <option value="12:00">12:00 PM (Lunch)</option>
                <option value="13:00">01:00 PM (Lunch)</option>
                <option value="14:00">02:00 PM (Lunch)</option>
                <option value="18:30">06:30 PM (Dinner)</option>
                <option value="19:30">07:30 PM (Dinner)</option>
                <option value="20:30">08:30 PM (Dinner)</option>
                <option value="21:30">09:30 PM (Dinner)</option>
              </select>
            </div>

            {/* Guests */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              paddingRight: "0.5rem"
            }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Users size={13} style={{ color: "var(--primary)" }} />
                <span>GUESTS</span>
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                style={{
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  marginTop: "0.25rem",
                  background: "transparent",
                  cursor: "pointer"
                }}
              >
                <option value={1}>1 Person</option>
                <option value={2}>2 Guests</option>
                <option value={3}>3 Guests</option>
                <option value={4}>4 Guests</option>
                <option value={6}>6 Guests</option>
                <option value={8}>8+ Family</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                height: "54px",
                width: "100%",
                borderRadius: "var(--radius-lg)",
                fontSize: "0.95rem",
                fontWeight: 700,
                letterSpacing: "0.02em"
              }}
            >
              <Search size={18} />
              <span>SEARCH</span>
            </button>
          </form>
        </div>

        {/* AI Quick Query Prompt Pills */}
        <div style={{
          marginTop: "1.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "0.5rem"
        }}>
          <span style={{ fontSize: "0.82rem", color: "#CBD5E1", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Sparkles size={14} style={{ color: "var(--accent)" }} />
            <span>AI Quick Prompts:</span>
          </span>
          {QUICK_AI_PROMPTS.slice(0, 3).map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onOpenAI(prompt)}
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                color: "#FFFFFF",
                padding: "0.35rem 0.85rem",
                borderRadius: "var(--radius-full)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                transition: "var(--transition)"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(224, 90, 27, 0.35)";
                e.currentTarget.style.borderColor = "var(--primary)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
            >
              <span>{prompt}</span>
              <ArrowRight size={12} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}