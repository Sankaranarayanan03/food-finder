import { useState, useEffect, useCallback } from "react";
import { Map, Grid, SlidersHorizontal } from "lucide-react";
import { FilterBar } from "../components/FilterBar";
import { RestaurantCard } from "../components/RestaurantCard";
import { InteractiveMap } from "../components/InteractiveMap";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export function SearchPage({
  initialParams = {},
  onSelectRestaurant,
  onBookRestaurant,
  onDirections,
  cities = [],
  cuisines = []
}) {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    city: initialParams.city || "",
    cuisine: initialParams.cuisine || "",
    search: initialParams.search || "",
    user_lat: initialParams.user_lat || null,
    user_lng: initialParams.user_lng || null,
    price_range: "",
    min_rating: "",
    open_now: "",
    table_status: "",
    parking_status: "",
    sort_by: initialParams.sort_by || "rating"
  });

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("split"); // 'grid', 'map', 'split'
  const [selectedMapRest, setSelectedMapRest] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [geoLoading, setGeoLoading] = useState(false);

  const [activeCategory, setActiveCategory] = useState("");

  const handleCategoryClick = (categorySearch) => {
    setActiveCategory(categorySearch);
    setGeoLoading(true);
    const targetSearch = filters.search === categorySearch ? "" : categorySearch;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLoading(false);
          setFilters((prev) => ({
            ...prev,
            search: targetSearch,
            user_lat: pos.coords.latitude,
            user_lng: pos.coords.longitude,
            sort_by: "distance"
          }));
        },
        () => {
          setGeoLoading(false);
          setFilters((prev) => ({
            ...prev,
            search: targetSearch,
            user_lat: prev.user_lat || 13.0827,
            user_lng: prev.user_lng || 80.2707,
            sort_by: "distance"
          }));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGeoLoading(false);
      setFilters((prev) => ({
        ...prev,
        search: targetSearch,
        user_lat: prev.user_lat || 13.0827,
        user_lng: prev.user_lng || 80.2707,
        sort_by: "distance"
      }));
    }
  };

  // Load restaurants on filter change
  useEffect(() => {
    let isMounted = true;
    async function fetchResults() {
      setLoading(true);
      try {
        const data = await api.getRestaurants(filters);
        if (isMounted) {
          setRestaurants(data);
          if (data.length > 0) {
            setSelectedMapRest((prev) => prev || data[0]);
          }
        }
      } catch (err) {
        console.error("Search fetch error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchResults();
    return () => { isMounted = false; };
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleLocationDetected = useCallback((coords) => {
    setFilters((prev) => {
      if (prev.user_lat === coords.lat && prev.user_lng === coords.lng && prev.sort_by === "distance") {
        return prev;
      }
      return {
        ...prev,
        user_lat: coords.lat,
        user_lng: coords.lng,
        sort_by: "distance"
      };
    });
  }, []);

  const handleResetFilters = () => {
    setActiveCategory("");
    setFilters({
      city: "",
      cuisine: "",
      search: "",
      price_range: "",
      min_rating: "",
      open_now: "",
      table_status: "",
      parking_status: "",
      sort_by: "rating"
    });
  };

  const handleToggleFav = async (id) => {
    try {
      const res = await api.toggleFavorite(id);
      setFavorites((prev) => {
        const next = new Set(prev);
        if (res.is_favorite) next.add(id);
        else next.delete(id);
        return next;
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: "1.5rem 0 4rem 0", backgroundColor: "var(--bg-main)", minHeight: "85vh" }}>
      <div className="container">
        {/* Personalized Dine Anytime Quick Discovery Bar */}
        <section style={{ marginBottom: "1.75rem", paddingBottom: "1.25rem", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--text-main)", marginBottom: "1rem" }}>
            Hi {user?.name?.split(" ")[0] || "Sankar"}, Dine Anytime!
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
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
                border: filters.search === "Breakfast" || activeCategory === "Breakfast" ? "2px solid var(--primary)" : "1.5px solid var(--border)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--primary)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = filters.search === "Breakfast" || activeCategory === "Breakfast" ? "var(--primary)" : "var(--border)"; }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                backgroundColor: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                flexShrink: 0
              }}>
                🥣
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-main)", display: "block" }}>Breakfast</span>
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
                border: filters.search === "Lunch" || activeCategory === "Lunch" ? "2px solid var(--primary)" : "1.5px solid var(--border)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--primary)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = filters.search === "Lunch" || activeCategory === "Lunch" ? "var(--primary)" : "var(--border)"; }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                backgroundColor: "#FFF3EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                flexShrink: 0
              }}>
                🍛
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-main)", display: "block" }}>Lunch</span>
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
                border: filters.search === "Dinner" || activeCategory === "Dinner" ? "2px solid var(--primary)" : "1.5px solid var(--border)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--primary)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = filters.search === "Dinner" || activeCategory === "Dinner" ? "var(--primary)" : "var(--border)"; }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                backgroundColor: "#FEF3C7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                flexShrink: 0
              }}>
                🥘
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-main)", display: "block" }}>Dinner</span>
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
                border: filters.search === "Fast Food" || activeCategory === "Fast Food" ? "2px solid var(--primary)" : "1.5px solid var(--border)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--primary)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = filters.search === "Fast Food" || activeCategory === "Fast Food" ? "var(--primary)" : "var(--border)"; }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                backgroundColor: "#ECFDF5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                flexShrink: 0
              }}>
                🍔
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-main)", display: "block" }}>Fast Food</span>
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
                border: (filters.sort_by === "distance" && !filters.search) || activeCategory === "" ? "2px solid var(--primary)" : "1.5px solid var(--border)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--primary)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = (filters.sort_by === "distance" && !filters.search) || activeCategory === "" ? "var(--primary)" : "var(--border)"; }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                backgroundColor: "#FEF2F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                flexShrink: 0
              }}>
                📍
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-main)", display: "block" }}>GPS Near Me</span>
                {geoLoading && activeCategory === "" ? (
                  <span style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 700 }}>Tracking GPS...</span>
                ) : filters.user_lat ? (
                  <span style={{ fontSize: "0.7rem", color: "#059669", fontWeight: 700 }}>GPS Active ✓</span>
                ) : (
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>Track Proximity</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Header & View Switcher */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 900 }}>
              Restaurant Discovery & Real-Time Availability
            </h1>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {filters.city ? `Showing tables in ${filters.city}` : "All Tamil Nadu Cities"} • Live Seat & Parking Sync
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {/* View Mode Buttons */}
            <div style={{
              display: "flex",
              backgroundColor: "var(--bg-card)",
              padding: "0.25rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)"
            }}>
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.45rem 0.8rem",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  backgroundColor: viewMode === "grid" ? "var(--primary)" : "transparent",
                  color: viewMode === "grid" ? "#FFFFFF" : "var(--text-muted)",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: viewMode === "grid" ? "0 2px 8px rgba(255, 84, 30, 0.3)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                <Grid size={15} />
                <span>Cards</span>
              </button>

              <button
                onClick={() => setViewMode("split")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.45rem 0.8rem",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  backgroundColor: viewMode === "split" ? "var(--primary)" : "transparent",
                  color: viewMode === "split" ? "#FFFFFF" : "var(--text-muted)",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: viewMode === "split" ? "0 2px 8px rgba(255, 84, 30, 0.3)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                <SlidersHorizontal size={15} />
                <span>Split View</span>
              </button>

              <button
                onClick={() => setViewMode("map")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.45rem 0.8rem",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  backgroundColor: viewMode === "map" ? "var(--primary)" : "transparent",
                  color: viewMode === "map" ? "#FFFFFF" : "var(--text-muted)",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: viewMode === "map" ? "0 2px 8px rgba(255, 84, 30, 0.3)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                <Map size={15} />
                <span>Map Only</span>
              </button>
            </div>
          </div>
        </div>



        {/* GPS Location Active Banner */}
        {filters.user_lat && filters.user_lng && (
          <div style={{
            backgroundColor: "#D1FAE5",
            color: "#065F46",
            border: "1.5px solid #34D399",
            borderRadius: "var(--radius-xl)",
            padding: "0.85rem 1.25rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 700,
            fontSize: "0.9rem",
            boxShadow: "var(--shadow-sm)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontSize: "1.25rem" }}>📍</span>
              <span>GPS DETECTED: Showing nearest Tamil Nadu restaurants based on your real-time location (Closest First)</span>
            </div>
            <button
              onClick={() => {
                handleFilterChange("user_lat", null);
                handleFilterChange("user_lng", null);
                handleFilterChange("sort_by", "rating");
              }}
              style={{
                backgroundColor: "#065F46",
                color: "#FFFFFF",
                border: "none",
                padding: "0.35rem 0.8rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.75rem",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Clear GPS Filter ×
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          cities={cities}
          cuisines={cuisines}
          totalCount={restaurants.length}
        />

        {/* Layout according to viewMode */}
        {viewMode === "split" ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "1.5rem",
            alignItems: "start"
          }}>
            {/* Left: Scrollable Restaurant Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  Updating search results...
                </div>
              ) : restaurants.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-xl)" }}>
                  <p style={{ fontWeight: 600, color: "var(--text-muted)" }}>No restaurants match your selected filters.</p>
                  <button onClick={handleResetFilters} className="btn btn-primary btn-sm" style={{ marginTop: "1rem" }}>
                    Reset Filters
                  </button>
                </div>
              ) : (
                restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    isSelected={selectedMapRest?.id === restaurant.id}
                    onSelect={(r) => setSelectedMapRest(r)}
                    onBook={onBookRestaurant}
                    onDirections={(r) => setSelectedMapRest(r)}
                    isFavorite={favorites.has(restaurant.id)}
                    onToggleFavorite={handleToggleFav}
                  />
                ))
              )}
            </div>

            {/* Right: Sticky Interactive Map */}
            <div style={{ position: "sticky", top: "90px" }}>
              <InteractiveMap
                restaurants={restaurants}
                selectedRestaurant={selectedMapRest}
                onSelectRestaurant={(r) => setSelectedMapRest(r)}
                onLocationDetected={handleLocationDetected}
              />
            </div>
          </div>
        ) : viewMode === "map" ? (
          <div style={{ height: "650px" }}>
            <InteractiveMap
              restaurants={restaurants}
              selectedRestaurant={selectedMapRest}
              onSelectRestaurant={(r) => setSelectedMapRest(r)}
              onLocationDetected={handleLocationDetected}
            />
          </div>
        ) : (
          /* Grid View */
          <div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                Loading restaurants...
              </div>
            ) : restaurants.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-xl)" }}>
                <p style={{ fontWeight: 600, color: "var(--text-muted)" }}>No restaurants match your selected filters.</p>
                <button onClick={handleResetFilters} className="btn btn-primary btn-sm" style={{ marginTop: "1rem" }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid-restaurants">
                {restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    isSelected={selectedMapRest?.id === restaurant.id}
                    onSelect={onSelectRestaurant}
                    onBook={onBookRestaurant}
                    onDirections={(r) => { setViewMode("split"); setSelectedMapRest(r); }}
                    isFavorite={favorites.has(restaurant.id)}
                    onToggleFavorite={handleToggleFav}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}