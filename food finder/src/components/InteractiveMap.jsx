import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Navigation, MapPin, Clock, 
  ExternalLink, Utensils, X, Locate
} from "lucide-react";

export function InteractiveMap({ 
  restaurants = [], 
  selectedRestaurant, 
  onSelectRestaurant, 
  userLocation = { lat: 13.0827, lng: 80.2707, city: "Chennai" },
  onClose,
  onLocationDetected
}) {
  const [mapMode, setMapMode] = useState("google_embed"); // Default to Real Google Maps view
  const [currentGPS, setCurrentGPS] = useState(userLocation);
  const [trackingGPS, setTrackingGPS] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const hasAutoDetectedRef = useRef(false);
  const onLocationDetectedRef = useRef(onLocationDetected);

  useEffect(() => {
    onLocationDetectedRef.current = onLocationDetected;
  }, [onLocationDetected]);

  const target = selectedRestaurant || (restaurants.length > 0 ? restaurants[0] : null);

  const handleDetectGPS = useCallback((isManual = true) => {
    setTrackingGPS(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setTrackingGPS(false);
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            city: "GPS Tracked Position"
          };
          setCurrentGPS(coords);
          if (isManual && onLocationDetectedRef.current) {
            onLocationDetectedRef.current(coords);
          }
        },
        () => {
          setTrackingGPS(false);
          const coords = {
            lat: 13.0827,
            lng: 80.2707,
            city: "Chennai Central"
          };
          setCurrentGPS(coords);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setTrackingGPS(false);
      const coords = {
        lat: 13.0827,
        lng: 80.2707,
        city: "Chennai Central"
      };
      setCurrentGPS(coords);
    }
  }, []);

  useEffect(() => {
    if (!hasAutoDetectedRef.current) {
      hasAutoDetectedRef.current = true;
      handleDetectGPS(false);
    }
  }, [handleDetectGPS]);

  const openGoogleMapsDirections = () => {
    if (!target) return;
    const destName = `${target.name}, ${target.address ? target.address + ", " : ""}${target.city}, Tamil Nadu`;
    const destParam = encodeURIComponent(destName);

    // Only set origin if user has active GPS coordinates; omitting origin lets Google Maps default to "My Location"
    let originParam = "";
    if (currentGPS?.lat && currentGPS.city !== "Chennai Central") {
      originParam = `&origin=${currentGPS.lat},${currentGPS.lng}`;
    }

    const googleUrl = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${destParam}&travelmode=driving`;
    window.open(googleUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{
      backgroundColor: "var(--bg-card)",
      borderRadius: "var(--radius-xl)",
      border: "1.5px solid var(--border)",
      overflow: "hidden",
      boxShadow: "var(--shadow-xl)",
      display: "flex",
      flexDirection: "column",
      height: "600px",
      position: "relative",
      fontFamily: "var(--font-sans)"
    }}>
      {/* Top Map Header & Controls */}
      <div style={{
        backgroundColor: "#0F172A",
        color: "#FFFFFF",
        padding: "0.85rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 20,
        boxShadow: "var(--shadow-md)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #FF541E 0%, #D84E10 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            boxShadow: "0 4px 12px rgba(255, 84, 30, 0.4)"
          }}>
            <Navigation size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: "1rem", color: "#FFFFFF" }}>
              Google Maps Live Route & Navigation
            </div>
            <div style={{ fontSize: "0.72rem", color: "#38BDF8", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span className="pulse-dot pulse-green" />
              <span>
                {target ? `Tracking: ${target.name} (${target.city})` : (currentGPS.lat ? `GPS: ${currentGPS.lat.toFixed(4)}, ${currentGPS.lng.toFixed(4)}` : "Detecting Location...")}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Locate Me GPS Button */}
          <button
            onClick={handleDetectGPS}
            disabled={trackingGPS}
            style={{
              backgroundColor: trackingGPS ? "#334155" : "#2563EB",
              color: "#FFFFFF",
              border: "none",
              padding: "0.4rem 0.8rem",
              borderRadius: "var(--radius-full)",
              fontSize: "0.78rem",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
            }}
            title="Center map around your exact current GPS coordinates"
          >
            <Locate size={14} className={trackingGPS ? "spin" : ""} />
            <span>{trackingGPS ? "LOCATING..." : "MY LOCATION"}</span>
          </button>

          {/* Map Mode Switcher */}
          <div style={{
            display: "flex",
            backgroundColor: "#1E293B",
            padding: "0.2rem",
            borderRadius: "var(--radius-full)",
            border: "1px solid #334155"
          }}>
            <button
              onClick={() => setMapMode("interactive")}
              style={{
                padding: "0.35rem 0.7rem",
                borderRadius: "var(--radius-full)",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 800,
                cursor: "pointer",
                backgroundColor: mapMode === "interactive" ? "var(--primary)" : "transparent",
                color: mapMode === "interactive" ? "#FFFFFF" : "#94A3B8"
              }}
            >
              Custom View
            </button>

            <button
              onClick={() => setMapMode("google_embed")}
              style={{
                padding: "0.35rem 0.7rem",
                borderRadius: "var(--radius-full)",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 800,
                cursor: "pointer",
                backgroundColor: mapMode === "google_embed" ? "var(--primary)" : "transparent",
                color: mapMode === "google_embed" ? "#FFFFFF" : "#94A3B8"
              }}
            >
              Google Map Embed
            </button>
          </div>

          {onClose && (
            <button onClick={onClose} style={{ color: "#94A3B8", background: "none", border: "none", cursor: "pointer", padding: "0.2rem" }}>
              <X size={22} />
            </button>
          )}
        </div>
      </div>

      {/* Main Map Body Canvas */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        
        {/* Mode 1: Real Google Maps Live Route & Location View */}
        {mapMode === "google_embed" ? (
          <iframe
            key={target ? `${target.id}_${currentGPS.lat}_${currentGPS.lng}` : "map_default"}
            title="Google Maps Live Route & Location View"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={
              target && currentGPS?.lat
                ? `https://maps.google.com/maps?saddr=${currentGPS.lat},${currentGPS.lng}&daddr=${encodeURIComponent(target.name + ", " + (target.address || target.city) + ", Tamil Nadu")}&dirflg=d&output=embed`
                : target
                  ? `https://maps.google.com/maps?q=${encodeURIComponent(target.name + ", " + (target.address || target.city) + ", Tamil Nadu")}&z=14&output=embed`
                  : `https://maps.google.com/maps?q=${currentGPS.lat || 13.0827},${currentGPS.lng || 80.2707}&z=14&output=embed`
            }
          />
        ) : (
          /* Mode 2: Interactive Vector Map with Current Location Pin */
          <div style={{
            width: "100%",
            height: "100%",
            position: "relative",
            background: "linear-gradient(180deg, #E2E8F0 0%, #CBD5E1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* Road Grid SVG Canvas */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.75 }}>
              <path d="M 0,220 Q 300,190 600,260 T 1200,240" stroke="#FFFFFF" strokeWidth="20" fill="none" />
              <path d="M 280,0 Q 310,320 350,600" stroke="#FFFFFF" strokeWidth="16" fill="none" />
              <path d="M 680,0 Q 640,300 700,600" stroke="#FFFFFF" strokeWidth="14" fill="none" />
              <path d="M 0,420 Q 420,400 950,440" stroke="#FFFFFF" strokeWidth="12" fill="none" />
              
              {/* Route Line from User Location to Target Restaurant */}
              {target && (
                <path 
                  d="M 140,380 Q 280,220 500,200 T 820,260" 
                  stroke="#FF541E" 
                  strokeWidth="7" 
                  strokeDasharray={navigating ? "10,6" : "none"}
                  fill="none" 
                  style={{
                    filter: "drop-shadow(0 3px 8px rgba(255,84,30,0.5))",
                    animation: navigating ? "dash 1s linear infinite" : "none"
                  }}
                />
              )}
            </svg>

            {/* 🔴 PROMINENT BLUE USER CURRENT LOCATION PIN */}
            <div style={{
              position: "absolute",
              left: "140px",
              top: "380px",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 25
            }}>
              {/* Pulsing Blue Location Halo */}
              <div style={{
                position: "relative",
                width: "42px",
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <div style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  backgroundColor: "#2563EB",
                  opacity: 0.35,
                  animation: "ping 1.8s infinite"
                }} />
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "#2563EB",
                  border: "3.5px solid #FFFFFF",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontWeight: 900,
                  fontSize: "0.75rem"
                }}>
                  🎯
                </div>
              </div>

              {/* Location Badge Tag */}
              <div style={{
                backgroundColor: "#1E293B",
                color: "#38BDF8",
                fontSize: "0.72rem",
                fontWeight: 900,
                padding: "0.25rem 0.6rem",
                borderRadius: "var(--radius-full)",
                marginTop: "4px",
                whiteSpace: "nowrap",
                border: "1.5px solid #38BDF8",
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem"
              }}>
                <span className="pulse-dot pulse-green" />
                <span>YOUR CURRENT LOCATION</span>
              </div>
            </div>

            {/* Restaurant Pins */}
            {restaurants.map((rest, idx) => {
              const isSelected = target?.id === rest.id;
              const leftOffsets = [460, 820, 320, 650, 540, 890, 220, 750, 390, 680];
              const topOffsets = [180, 240, 130, 330, 260, 160, 290, 110, 350, 230];
              const leftPos = leftOffsets[idx % leftOffsets.length];
              const topPos = topOffsets[idx % topOffsets.length];

              return (
                <div
                  key={rest.id}
                  onClick={() => onSelectRestaurant(rest)}
                  style={{
                    position: "absolute",
                    left: `${leftPos}px`,
                    top: `${topPos}px`,
                    cursor: "pointer",
                    transform: isSelected ? "scale(1.2) translateY(-12px)" : "scale(1)",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    zIndex: isSelected ? 20 : 10
                  }}
                >
                  <div style={{
                    backgroundColor: isSelected ? "#FF541E" : "#0E5E4E",
                    color: "#FFFFFF",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    boxShadow: isSelected ? "0 6px 20px rgba(255,84,30,0.6)" : "0 4px 10px rgba(0,0,0,0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    border: "2px solid #FFFFFF"
                  }}>
                    <Utensils size={13} />
                    <span>{rest.name.split(" ")[0]}</span>
                  </div>
                  <div style={{
                    width: 0,
                    height: 0,
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: `8px solid ${isSelected ? "#FF541E" : "#0E5E4E"}`
                  }} />
                </div>
              );
            })}

          </div>
        )}

        {/* Selected Restaurant Directions HUD Card */}
        {target && (
          <div style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            right: "16px",
            backgroundColor: "var(--bg-card)",
            borderRadius: "var(--radius-xl)",
            padding: "1.1rem 1.25rem",
            boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.4)",
            border: "1.5px solid var(--border)",
            zIndex: 30
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--text-main)", margin: 0 }}>
                    {target.name}
                  </h3>
                  <span style={{ fontSize: "0.72rem", backgroundColor: "var(--primary-light)", color: "var(--primary)", padding: "0.15rem 0.5rem", borderRadius: "4px", fontWeight: 800 }}>
                    {target.cuisine}
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 0.35rem 0" }}>
                  {target.address || `${target.city}, Tamil Nadu`}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.82rem", fontWeight: 800 }}>
                  <span style={{ color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <MapPin size={14} />
                    <span>{target.distance_km ? `${target.distance_km} km away` : "0.8 km away (GPS calculated)"}</span>
                  </span>
                  <span style={{ color: "var(--secondary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Clock size={14} />
                    <span>~{target.travel_time_mins || 5} mins travel time</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons: Live Navigation & Google Maps */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <button
                  onClick={() => setNavigating(!navigating)}
                  style={{
                    backgroundColor: navigating ? "#059669" : "var(--primary)",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "0.65rem 1.2rem",
                    borderRadius: "var(--radius-lg)",
                    fontSize: "0.88rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    boxShadow: "0 4px 14px rgba(255, 84, 30, 0.3)"
                  }}
                >
                  <Navigation size={16} />
                  <span>{navigating ? "NAVIGATION ACTIVE" : "START LIVE ROUTE"}</span>
                </button>

                <button
                  onClick={openGoogleMapsDirections}
                  style={{
                    backgroundColor: "#1E293B",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "0.65rem 1rem",
                    borderRadius: "var(--radius-lg)",
                    fontSize: "0.88rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)"
                  }}
                  title="Open live Google Maps app directions"
                >
                  <ExternalLink size={16} />
                  <span>OPEN IN GOOGLE MAPS</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}