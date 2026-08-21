import { useState, useEffect } from "react";
import { 
  Sparkles, MapPin, Star, 
  ArrowRight, History
} from "lucide-react";
import { RestaurantCard } from "../components/RestaurantCard";
import { TrendingCarousel } from "../components/TrendingCarousel";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export function HomePage({ 
  onSearch, 
  onSelectRestaurant, 
  onBookRestaurant, 
  onDirections, 
  onOpenAI,
  selectedCity,
  onSelectCity,
  recentlyViewed = []
}) {
  const { user } = useAuth();
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [topRatedRestaurants, setTopRatedRestaurants] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);

  const [activeCategory, setActiveCategory] = useState("");

  const handleCategoryClick = (categorySearch) => {
    setActiveCategory(categorySearch);
    setGeoLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLoading(false);
          onSearch({
            search: categorySearch,
            user_lat: pos.coords.latitude,
            user_lng: pos.coords.longitude,
            sort_by: "distance",
            city: selectedCity === "All Cities" ? "" : selectedCity
          });
        },
        () => {
          setGeoLoading(false);
          onSearch({
            search: categorySearch,
            user_lat: 13.0827,
            user_lng: 80.2707,
            sort_by: "distance",
            city: selectedCity === "All Cities" ? "" : selectedCity
          });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGeoLoading(false);
      onSearch({
        search: categorySearch,
        user_lat: 13.0827,
        user_lng: 80.2707,
        sort_by: "distance",
        city: selectedCity === "All Cities" ? "" : selectedCity
      });
    }
  };

  useEffect(() => {
    async function loadHomeData() {
      setLoading(true);
      try {
        const list = await api.getRestaurants({ city: selectedCity === "All Cities" ? "" : selectedCity });
        setFeaturedRestaurants(list);
        
        // Sort by rating for top-rated
        const sorted = [...list].sort((a, b) => b.rating - a.rating);
        setTopRatedRestaurants(sorted.slice(0, 6));

        // Load favorites
        try {
          const prof = await api.getProfile();
          if (prof?.favorites) {
            setFavorites(new Set(prof.favorites.map((f) => f.id)));
          }
        } catch {
          // ignore profile fetch failure for unauthenticated users
        }
      } catch (err) {
        console.error("Failed to load home restaurants", err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, [selectedCity]);

  const handleToggleFavorite = async (restId) => {
    try {
      const isFav = favorites.has(restId);
      if (isFav) {
        await api.removeFavorite(restId);
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(restId);
          return next;
        });
      } else {
        await api.addFavorite(restId);
        setFavorites((prev) => new Set(prev).add(restId));
      }
    } catch (err) {
      console.error("Favorite toggle error", err);
    }
  };

  const CITY_SPOTLIGHTS = [
    { name: "Chennai", subtitle: "Capital of Chettinad & Tiffin", img: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80" },
    { name: "Coimbatore", subtitle: "Kongunadu Flavor Trail", img: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80" },
    { name: "Madurai", subtitle: "Kari Dosa & Jigarthanda Capital", img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80" },
    { name: "Dindigul", subtitle: "Legendary Seeraga Samba Biryani", img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80" }
  ];

  return (
    <div>
      {/* Personalized Dine Anytime Quick Discovery Bar (Matching Image Design) */}
      <section style={{ padding: "1.75rem 0 1.25rem 0", backgroundColor: "var(--bg-main)", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-main)", marginBottom: "1.1rem" }}>
            Hi {user?.name?.split(" ")[0] || "Sankar"}, Dine Anytime!
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem"
          }}>
            {/* 1. Breakfast */}
            <div
              onClick={() => handleCategoryClick("Breakfast")}
              style={{
                backgroundColor: "var(--bg-card)",
                borderRadius: "var(--radius-lg)",
                padding: "0.85rem 1.1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                boxShadow: "var(--shadow-sm)",
                border: activeCategory === "Breakfast" ? "2px solid var(--primary)" : "1.5px solid var(--border)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = "var(--primary)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.borderColor = activeCategory === "Breakfast" ? "var(--primary)" : "var(--border)"; }}
            >
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "#F0F9FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem"
              }}>
                🥣
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-main)", display: "block" }}>Breakfast</span>
                {geoLoading && activeCategory === "Breakfast" && <span style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 700 }}>Tracking GPS...</span>}
              </div>
            </div>

            {/* 2. Lunch */}
            <div
              onClick={() => handleCategoryClick("Lunch")}
              style={{
                backgroundColor: "var(--bg-card)",
                borderRadius: "var(--radius-lg)",
                padding: "0.85rem 1.1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                boxShadow: "var(--shadow-sm)",
                border: activeCategory === "Lunch" ? "2px solid var(--primary)" : "1.5px solid var(--border)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = "var(--primary)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.borderColor = activeCategory === "Lunch" ? "var(--primary)" : "var(--border)"; }}
            >
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "#FFF3EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem"
              }}>
                🍛
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-main)", display: "block" }}>Lunch</span>
                {geoLoading && activeCategory === "Lunch" && <span style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 700 }}>Tracking GPS...</span>}
              </div>
            </div>

            {/* 3. Dinner */}
            <div
              onClick={() => handleCategoryClick("Dinner")}
              style={{
                backgroundColor: "var(--bg-card)",
                borderRadius: "var(--radius-lg)",
                padding: "0.85rem 1.1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                boxShadow: "var(--shadow-sm)",
                border: activeCategory === "Dinner" ? "2px solid var(--primary)" : "1.5px solid var(--border)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = "var(--primary)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.borderColor = activeCategory === "Dinner" ? "var(--primary)" : "var(--border)"; }}
            >
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "#FEF3C7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem"
              }}>
                🥘
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-main)", display: "block" }}>Dinner</span>
                {geoLoading && activeCategory === "Dinner" && <span style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 700 }}>Tracking GPS...</span>}
              </div>
            </div>

            {/* 4. Fast Food */}
            <div
              onClick={() => handleCategoryClick("Fast Food")}
              style={{
                backgroundColor: "var(--bg-card)",
                borderRadius: "var(--radius-lg)",
                padding: "0.85rem 1.1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                boxShadow: "var(--shadow-sm)",
                border: activeCategory === "Fast Food" ? "2px solid var(--primary)" : "1.5px solid var(--border)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = "var(--primary)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.borderColor = activeCategory === "Fast Food" ? "var(--primary)" : "var(--border)"; }}
            >
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "#ECFDF5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem"
              }}>
                🍔
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-main)", display: "block" }}>Fast Food</span>
                {geoLoading && activeCategory === "Fast Food" && <span style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 700 }}>Tracking GPS...</span>}
              </div>
            </div>

            {/* 5. Near Me / GPS Tracker */}
            <div
              onClick={() => handleCategoryClick("")}
              style={{
                backgroundColor: "var(--bg-card)",
                borderRadius: "var(--radius-lg)",
                padding: "0.85rem 1.1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                boxShadow: "var(--shadow-sm)",
                border: activeCategory === "" ? "2px solid var(--primary)" : "1.5px solid var(--border)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = "var(--primary)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.borderColor = activeCategory === "" ? "var(--primary)" : "var(--border)"; }}
            >
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "#FEF2F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem"
              }}>
                📍
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-main)", display: "block" }}>GPS Near Me</span>
                {geoLoading && activeCategory === "" ? (
                  <span style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 700 }}>Tracking GPS...</span>
                ) : (
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>Track Proximity</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* EazyDiner & OpenTable Prime Perks Section */}
      <section style={{ padding: "2rem 0", backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div style={{
            background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #064E3B 100%)",
            borderRadius: "var(--radius-xl)",
            padding: "2rem",
            color: "#FFFFFF",
            boxShadow: "var(--shadow-xl)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.5rem",
            alignItems: "center"
          }}>
            <div>
              <span className="badge" style={{ backgroundColor: "#F59E0B", color: "#0F172A", fontWeight: 900, marginBottom: "0.5rem" }}>
                EAZYDINER & OPENTABLE PRIME PERKS
              </span>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 900, marginTop: "0.4rem", marginBottom: "0.4rem", color: "#FFFFFF" }}>
                Instant Table Reservation & Prime Deals
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#CBD5E1", margin: 0 }}>
                Instant Table Locking • 6-Digit WhatsApp Pass • Flat 25%-50% OFF Discounts • +10 Loyalty Points per Visit
              </p>
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "0.85rem 1.1rem", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.15)", textAlign: "center" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#34D399" }}>Instant</div>
                <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>6-Digit WhatsApp Pass</div>
              </div>

              <div style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "0.85rem 1.1rem", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.15)", textAlign: "center" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#FBBF24" }}>Up to 50%</div>
                <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Prime Dine-In Deals</div>
              </div>

              <div style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "0.85rem 1.1rem", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.15)", textAlign: "center" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#60A5FA" }}>5 Mins</div>
                <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Arrival Grace Rule</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Trending Carousel */}
      <TrendingCarousel onSelectRestaurant={onSelectRestaurant} onBook={onBookRestaurant} />

      {/* City Spotlight Section */}
      <section style={{ padding: "3.5rem 0 2rem 0", backgroundColor: "var(--bg-main)" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: "0.4rem" }}>
                Regional Culinary Hubs
              </span>
              <h2 style={{ fontSize: "1.85rem", fontWeight: 900 }}>
                Explore by Tamil Nadu City
              </h2>
            </div>
            <button
              onClick={() => onSearch({})}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, color: "var(--primary)", fontSize: "0.9rem" }}
            >
              <span>View All 15 Cities</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            {CITY_SPOTLIGHTS.map((c) => (
              <div
                key={c.name}
                onClick={() => { onSelectCity(c.name); onSearch({ city: c.name }); }}
                style={{
                  position: "relative",
                  height: "180px",
                  borderRadius: "var(--radius-xl)",
                  overflow: "hidden",
                  cursor: "pointer",
                  boxShadow: "var(--shadow-md)",
                  transition: "var(--transition)"
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <img
                  src={c.img}
                  alt={c.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(15, 23, 42, 0.1) 0%, rgba(15, 23, 42, 0.85) 100%)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "1.25rem",
                  color: "#FFFFFF"
                }}>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#FFFFFF" }}>{c.name}</h3>
                  <p style={{ fontSize: "0.78rem", color: "#E2E8F0" }}>{c.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Live Availability Grid */}
      <section style={{ padding: "3rem 0", backgroundColor: "var(--bg-card)" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
                <span className="pulse-dot pulse-green" />
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--secondary)", textTransform: "uppercase" }}>
                  Live Seat Availability ({selectedCity || "Tamil Nadu"})
                </span>
              </div>
              <h2 style={{ fontSize: "1.85rem", fontWeight: 900 }}>
                Popular Dining Right Now
              </h2>
            </div>
            
            <button
              onClick={() => onSearch({ city: selectedCity === "All Cities" ? "" : selectedCity })}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 700 }}
            >
              <span>Explore All Restaurants</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)", fontSize: "1rem" }}>
              Loading real-time restaurant availability...
            </div>
          ) : featuredRestaurants.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 0", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-xl)" }}>
              <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>No restaurants found in {selectedCity}.</p>
              <button onClick={() => onSelectCity("All Cities")} className="btn btn-primary btn-sm" style={{ marginTop: "1rem" }}>
                View All Tamil Nadu Cities
              </button>
            </div>
          ) : (
            <div className="grid-restaurants">
              {featuredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onSelect={onSelectRestaurant}
                  onBook={onBookRestaurant}
                  onDirections={onDirections}
                  isFavorite={favorites.has(restaurant.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feature 7: Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section style={{ padding: "2.5rem 0", backgroundColor: "var(--bg-main)" }}>
          <div className="container">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <History size={20} style={{ color: "var(--text-muted)" }} />
                <h2 style={{ fontSize: "1.35rem", fontWeight: 900 }}>Recently Viewed</h2>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.85rem",
                overflowX: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                paddingBottom: "0.25rem",
              }}
            >
              {recentlyViewed.map((r) => (
                <div
                  key={r.id}
                  onClick={() => onSelectRestaurant(r)}
                  style={{
                    minWidth: "175px",
                    maxWidth: "175px",
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                    cursor: "pointer",
                    boxShadow: "var(--shadow-sm)",
                    transition: "var(--transition)",
                    flexShrink: 0,
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-3px)", e.currentTarget.style.boxShadow = "var(--shadow-lg)")}
                  onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "var(--shadow-sm)")}
                >
                  <div style={{ height: "100px", overflow: "hidden", backgroundColor: "#E2E8F0" }}>
                    <img
                      src={r.image_url || "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80"}
                      alt={r.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ padding: "0.65rem" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.name}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <MapPin size={10} style={{ color: "var(--primary)" }} />
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.city} • {r.cuisine}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", marginTop: "0.35rem" }}>
                      <Star size={11} style={{ fill: "#F59E0B", color: "#F59E0B" }} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>{r.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI Recommendation Banner Callout */}
      <section style={{ padding: "2.5rem 0", backgroundColor: "var(--bg-card)" }}>
        <div className="container">
          <div style={{
            background: "linear-gradient(135deg, #0E5E4E 0%, #064E3B 100%)",
            borderRadius: "var(--radius-xl)",
            padding: "2.5rem 2rem",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1.5rem",
            boxShadow: "var(--shadow-xl)"
          }}>
            <div style={{ maxWidth: "600px" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                padding: "0.25rem 0.75rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.75rem",
                fontWeight: 700,
                marginBottom: "0.75rem"
              }}>
                <Sparkles size={14} style={{ color: "var(--accent)" }} />
                <span>AI NATURAL LANGUAGE SEARCH</span>
              </div>
              <h3 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#FFFFFF", marginBottom: "0.5rem" }}>
                Can't decide where to eat? Let AI match your taste.
              </h3>
              <p style={{ fontSize: "0.95rem", color: "#E2E8F0", lineHeight: 1.6 }}>
                Simply describe your budget, preferred city, spice level, or parking needs in plain English. Our AI will rank the best matching tables instantly.
              </p>
            </div>

            <button
              onClick={() => onOpenAI()}
              className="btn btn-primary"
              style={{
                backgroundColor: "#FFFFFF",
                color: "var(--secondary)",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                fontWeight: 800,
                fontSize: "1rem",
                padding: "0.9rem 1.75rem"
              }}
            >
              <Sparkles size={18} style={{ color: "var(--primary)" }} />
              <span>LAUNCH AI FOOD FINDER</span>
            </button>
          </div>
        </div>
      </section>

      {/* Top Rated & Verified Spotlight */}
      <section style={{ padding: "3rem 0", backgroundColor: "var(--bg-main)" }}>
        <div className="container">
          <div style={{ marginBottom: "1.75rem" }}>
            <span className="badge badge-verified" style={{ marginBottom: "0.4rem" }}>
              100% Verified Visits
            </span>
            <h2 style={{ fontSize: "1.85rem", fontWeight: 900 }}>
              Highest Rated by Verified Diners
            </h2>
          </div>

          <div className="grid-restaurants">
            {topRatedRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onSelect={onSelectRestaurant}
                onBook={onBookRestaurant}
                onDirections={onDirections}
                isFavorite={favorites.has(restaurant.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}