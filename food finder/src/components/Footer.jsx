import { Utensils, Heart, ShieldCheck, Sparkles } from "lucide-react";

export function Footer({ onSelectCity, onSelectCuisine }) {
  const TN_CITIES = [
    "Chennai", "Coimbatore", "Madurai", "Salem", "Erode", "Tiruchirappalli", 
    "Tirunelveli", "Thanjavur", "Dindigul", "Ooty", "Tiruppur", "Thoothukudi", 
    "Vellore", "Hosur", "Kanchipuram"
  ];

  const POPULAR_CUISINES = [
    "Chettinad", "Kongunadu", "Madurai Cuisine", "Biryani", "Tamil Cuisine", 
    "Vegetarian", "Seafood", "Parotta", "Traditional Meals", "Idli", "Dosa"
  ];

  return (
    <footer style={{
      backgroundColor: "var(--bg-dark)",
      color: "#94A3B8",
      paddingTop: "3.5rem",
      paddingBottom: "2rem",
      borderTop: "1px solid #1E293B",
      marginTop: "auto"
    }}>
      <div className="container">
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "2.5rem",
          marginBottom: "3rem"
        }}>
          {/* Brand Intro */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#FFFFFF", marginBottom: "1rem" }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF"
              }}>
                <Utensils size={18} />
              </div>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.2rem" }}>
                Smart<span style={{ color: "var(--primary)" }}>Finder</span>
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              Tamil Nadu's premier intelligent restaurant discovery & reservation network. Real-time availability, AI recommendations, verified visits, and loyalty rewards.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#E2E8F0" }}>
              <ShieldCheck size={16} style={{ color: "var(--success)" }} />
              <span>100% Server-Verified 6-Digit Check-in</span>
            </div>
          </div>

          {/* Cities Links */}
          <div>
            <h4 style={{ color: "#FFFFFF", fontSize: "0.95rem", fontWeight: 700, marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tamil Nadu Cities
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {TN_CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => onSelectCity(city)}
                  style={{
                    fontSize: "0.78rem",
                    color: "#94A3B8",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    transition: "var(--transition)"
                  }}
                  onMouseOver={(e) => (e.target.style.color = "#FFFFFF")}
                  onMouseOut={(e) => (e.target.style.color = "#94A3B8")}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisine Links */}
          <div>
            <h4 style={{ color: "#FFFFFF", fontSize: "0.95rem", fontWeight: 700, marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Regional Cuisines
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {POPULAR_CUISINES.map((cuisine) => (
                <button
                  key={cuisine}
                  onClick={() => onSelectCuisine(cuisine)}
                  style={{
                    fontSize: "0.78rem",
                    color: "#94A3B8",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    transition: "var(--transition)"
                  }}
                  onMouseOver={(e) => (e.target.style.color = "#FFFFFF")}
                  onMouseOut={(e) => (e.target.style.color = "#94A3B8")}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 style={{ color: "#FFFFFF", fontSize: "0.95rem", fontWeight: 700, marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Smart Platform
            </h4>
            <ul style={{ listStyle: "none", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Sparkles size={14} style={{ color: "var(--accent)" }} />
                <span>AI Intent Matcher</span>
              </li>
              <li>• Real-Time Seat & Parking Track</li>
              <li>• Google Maps Navigation Mode</li>
              <li>• 10 Loyalty Points per Check-In</li>
              <li>• Owner Live Control Terminal</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          paddingTop: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          fontSize: "0.8rem"
        }}>
          <div>
            © {new Date().getFullYear()} Smart Restaurant Finder (Tamil Nadu Edition). All rights reserved.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span>Crafted for Tamil Nadu with</span>
            <Heart size={14} style={{ color: "var(--primary)", fill: "var(--primary)" }} />
            <span>spice & hospitality</span>
          </div>
        </div>
      </div>
    </footer>
  );
}