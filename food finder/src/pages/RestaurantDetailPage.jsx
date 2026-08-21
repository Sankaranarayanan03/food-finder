import { useState, useEffect } from "react";
import { 
  Star, MapPin, Clock, Users, Utensils, Heart, 
  ShieldCheck, AlertTriangle, 
  ChevronRight, CheckCircle2, Share2, 
  Plus, Minus, ShoppingBag, Sparkles, Trash2
} from "lucide-react";
import { api } from "../services/api";
import { useRealtime } from "../context/RealtimeContext";
import { InteractiveMap } from "../components/InteractiveMap";
import { PhotoGallery } from "../components/PhotoGallery";

export function RestaurantDetailPage({
  restaurantId,
  onBack,
  onBook,
  onOpenWaitlist,
  onOpenFileComplaint
}) {
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeMenuTab, setActiveMenuTab] = useState("All");
  const [dietaryFilter, setDietaryFilter] = useState("ALL"); // 'ALL', 'VEG', 'NON_VEG', 'SPICY', 'CHEF'
  const [preOrderCart, setPreOrderCart] = useState({}); // { [itemId]: { item, qty } }
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  const { liveUpdates } = useRealtime();

  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      try {
        const data = await api.getRestaurantDetails(restaurantId);
        setRestaurant(data);
        const revs = await api.getRestaurantReviews(restaurantId);
        setReviews(revs);

        // Check if favorite
        try {
          const prof = await api.getProfile();
          if (prof?.favorites?.some((f) => f.id === parseInt(restaurantId))) {
            setIsFavorite(true);
          }
        } catch {
          // ignore error for unauthenticated user profile fetch
        }
      } catch (err) {
        console.error("Failed to load restaurant details", err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [restaurantId]);

  const handleToggleFav = async () => {
    try {
      const res = await api.toggleFavorite(restaurant.id);
      setIsFavorite(res.is_favorite);
    } catch (e) {
      console.error(e);
    }
  };

  // Spice level helper
  const getSpiceInfo = (item) => {
    const text = `${item.name} ${item.description || ""}`.toLowerCase();
    if (text.includes("pepper") || text.includes("fiery") || text.includes("chilli") || text.includes("chettinad") || text.includes("pallipalayam") || text.includes("spicy")) {
      return { level: 3, label: "Fiery Hot", icon: "🌶️🌶️🌶️", color: "#DC2626", bg: "#FEF2F2" };
    }
    if (text.includes("curry") || text.includes("masala") || text.includes("fry") || text.includes("roast") || text.includes("biryani") || text.includes("kothu")) {
      return { level: 2, label: "Medium", icon: "🌶️🌶️", color: "#EA580C", bg: "#FFF7ED" };
    }
    return { level: 1, label: "Mild", icon: "🌶️", color: "#16A34A", bg: "#F0FDF4" };
  };

  // Chef signature helper
  const isChefSpecial = (item) => {
    const text = `${item.name}`.toLowerCase();
    return text.includes("biryani") || text.includes("pepper") || text.includes("kari") || text.includes("mallipoo") || text.includes("special") || text.includes("meals") || text.includes("parotta") || text.includes("roast") || text.includes("crab");
  };

  // Pre-Order handlers
  const handleAddPreOrder = (item) => {
    setPreOrderCart((prev) => {
      const curr = prev[item.id]?.qty || 0;
      return { ...prev, [item.id]: { item, qty: curr + 1 } };
    });
  };

  const handleRemovePreOrder = (item) => {
    setPreOrderCart((prev) => {
      const curr = prev[item.id]?.qty || 0;
      if (curr <= 1) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: { item, qty: curr - 1 } };
    });
  };

  const preOrderItemsList = Object.values(preOrderCart);
  const preOrderCount = preOrderItemsList.reduce((acc, x) => acc + x.qty, 0);
  const preOrderTotal = preOrderItemsList.reduce((acc, x) => acc + (x.qty * x.item.price), 0);

  if (loading || !restaurant) {
    return (
      <div className="container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Loading restaurant details & live status...</p>
      </div>
    );
  }

  // Live overrides
  const live = liveUpdates[restaurant.id];
  const isOpen = live?.is_open !== undefined ? live.is_open : restaurant.is_open;
  const tableStatus = live?.table_status || restaurant.table_status;
  const foodStatus = live?.food_status || restaurant.food_status;
  const parkingStatus = live?.parking_status || restaurant.parking_status;
  const waitTime = live?.wait_time_mins !== undefined ? live.wait_time_mins : restaurant.wait_time_mins;

  // Categories for Menu
  const menuCategories = ["All", ...new Set(restaurant.menu_items?.map((m) => m.category) || [])];
  const rawFilteredMenu = activeMenuTab === "All"
    ? (restaurant.menu_items || [])
    : (restaurant.menu_items?.filter((m) => m.category === activeMenuTab) || []);

  const filteredMenu = rawFilteredMenu.filter((item) => {
    if (dietaryFilter === "VEG") return item.is_vegetarian;
    if (dietaryFilter === "NON_VEG") return !item.is_vegetarian;
    if (dietaryFilter === "SPICY") return getSpiceInfo(item).level >= 2;
    if (dietaryFilter === "CHEF") return isChefSpecial(item);
    return true;
  });

  return (
    <div style={{ padding: "1.5rem 0 4rem 0", backgroundColor: "var(--bg-main)" }}>
      <div className="container">
        {/* Breadcrumb Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
          <button onClick={onBack} style={{ color: "var(--primary)", fontWeight: 700 }}>
            ← Back to Restaurants
          </button>
          <span>/</span>
          <span>{restaurant.city}</span>
          <span>/</span>
          <span style={{ color: "var(--text-main)", fontWeight: 600 }}>{restaurant.name}</span>
        </div>

        {/* Hero Gallery Banner */}
        <div style={{
          position: "relative",
          height: "380px",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          marginBottom: "2rem",
          boxShadow: "var(--shadow-lg)"
        }}>
          <img
            src={restaurant.image_url || "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200&auto=format&fit=crop&q=80"}
            alt={restaurant.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />

          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.85) 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "2rem",
            color: "#FFFFFF"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span className="badge badge-primary">{restaurant.cuisine}</span>
              <span className="badge" style={{ backgroundColor: isOpen ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)", color: isOpen ? "#4ADE80" : "#FCA5A5" }}>{isOpen ? "Open Now" : "Closed"}</span>
              <span className="badge" style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#FFFFFF" }}>{restaurant.price_range}</span>
              {tableStatus === "AVAILABLE" ? (
                <span className="badge badge-available">● Tables Available</span>
              ) : tableStatus === "LIMITED" ? (
                <span className="badge badge-limited">● Few Tables Left</span>
              ) : (
                <span className="badge badge-full">● Tables Full (Join Waitlist)</span>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 900, color: "#FFFFFF", marginBottom: "0.4rem" }}>
                  {restaurant.name}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", fontSize: "0.9rem", color: "#E2E8F0" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <MapPin size={16} style={{ color: "var(--primary)" }} />
                    {restaurant.address}
                  </span>
                  <span>•</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Clock size={16} />
                    {restaurant.open_time} - {restaurant.close_time}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  onClick={handleToggleFav}
                  className="btn"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(6px)",
                    color: isFavorite ? "var(--danger)" : "#FFFFFF"
                  }}
                >
                  <Heart size={18} style={{ fill: isFavorite ? "var(--danger)" : "transparent" }} />
                  <span>{isFavorite ? "FAVORITED" : "FAVORITE"}</span>
                </button>

                {/* Feature 8: Share button */}
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/?restaurant=${restaurant.id}`;
                    if (navigator.share) {
                      navigator.share({ title: restaurant.name, text: `Check out ${restaurant.name} in ${restaurant.city}!`, url: shareUrl });
                    } else {
                      navigator.clipboard.writeText(shareUrl).then(() => alert(`Link copied! Share: ${restaurant.name}`));
                    }
                  }}
                  className="btn"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(6px)",
                    color: "#FFFFFF"
                  }}
                >
                  <Share2 size={18} />
                  <span>SHARE</span>
                </button>

                <button
                  onClick={() => onBook(restaurant)}
                  className="btn btn-primary btn-lg"
                  style={{ fontWeight: 800 }}
                >
                  <Utensils size={18} />
                  <span>BOOK TABLE NOW</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Body 2-Column Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 0.7fr",
          gap: "2rem",
          alignItems: "start"
        }}>
          {/* Left Column: Info, Live Status, Menu, Reviews */}
          <div>
            {/* Feature 1: Photo Gallery */}
            <div style={{
              backgroundColor: "var(--bg-card)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-sm)",
              marginBottom: "1.75rem"
            }}>
              <PhotoGallery restaurant={restaurant} />
            </div>

            {/* Live Real-time Status Card */}
            <div style={{

              backgroundColor: "var(--bg-card)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-sm)",
              marginBottom: "1.75rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
                <span className="pulse-dot pulse-green" />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Owner Live Status Tracker</h3>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "1rem"
              }}>
                <div style={{ backgroundColor: "#F8FAFC", padding: "0.85rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>SEAT AVAILABILITY</div>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", marginTop: "0.2rem", color: tableStatus === "AVAILABLE" ? "var(--secondary)" : "var(--warning)" }}>
                    {tableStatus}
                  </div>
                </div>

                <div style={{ backgroundColor: "#F8FAFC", padding: "0.85rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>WAITING TIME</div>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", marginTop: "0.2rem", color: "var(--accent)" }}>
                    {waitTime} Minutes
                  </div>
                </div>

                <div style={{ backgroundColor: "#F8FAFC", padding: "0.85rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>PARKING STATUS</div>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", marginTop: "0.2rem", color: parkingStatus === "AVAILABLE" ? "var(--secondary)" : "var(--danger)" }}>
                    {parkingStatus}
                  </div>
                </div>

                <div style={{ backgroundColor: "#F8FAFC", padding: "0.85rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>KITCHEN STATUS</div>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", marginTop: "0.2rem", color: foodStatus === "AVAILABLE" ? "var(--secondary)" : "var(--danger)" }}>
                    {foodStatus}
                  </div>
                </div>
              </div>

              {tableStatus === "FULL" && (
                <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FEF3C7", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#92400E" }}>
                    Tables are currently full. Would you like to enter the live queue?
                  </span>
                  <button onClick={() => onOpenWaitlist(restaurant)} className="btn btn-primary btn-sm">
                    Join Waitlist
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{
              backgroundColor: "var(--bg-card)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-sm)",
              marginBottom: "1.75rem"
            }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.6rem" }}>About This Restaurant</h3>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.7, fontSize: "0.95rem" }}>
                {restaurant.description || "Authentic culinary experience celebrating classic Tamil Nadu flavours and heritage recipes."}
              </p>
            </div>

            {/* Menu Section with Feature 4: Dietary / Spice Badges & Dine-In Pre-Order */}
            <div style={{
              backgroundColor: "var(--bg-card)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-sm)",
              marginBottom: "1.75rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Utensils size={18} style={{ color: "var(--primary)" }} />
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Signature Regional Menu</h3>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                    Pre-order your favorite starters & mains for instant service when seated
                  </p>
                </div>

                {/* Category Pills */}
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {menuCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveMenuTab(cat)}
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        backgroundColor: activeMenuTab === cat ? "var(--primary)" : "var(--bg-main)",
                        color: activeMenuTab === cat ? "#FFFFFF" : "var(--text-muted)",
                        border: "1px solid var(--border)"
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary & Spice Quick Filters */}
              <div style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                padding: "0.6rem 0",
                marginBottom: "1.25rem",
                borderBottom: "1px dashed var(--border)"
              }}>
                {[
                  { key: "ALL", label: "All Dishes", icon: null },
                  { key: "VEG", label: "🌱 Pure Veg", icon: null },
                  { key: "NON_VEG", label: "🍗 Non-Veg", icon: null },
                  { key: "SPICY", label: "🌶️ Spicy & Fiery", icon: null },
                  { key: "CHEF", label: "⭐ Chef's Signature", icon: null },
                ].map((df) => (
                  <button
                    key={df.key}
                    onClick={() => setDietaryFilter(df.key)}
                    style={{
                      padding: "0.3rem 0.7rem",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: dietaryFilter === df.key ? "var(--primary-light)" : "var(--bg-main)",
                      color: dietaryFilter === df.key ? "var(--primary)" : "var(--text-muted)",
                      border: `1px solid ${dietaryFilter === df.key ? "var(--primary)" : "var(--border)"}`,
                      transition: "var(--transition)"
                    }}
                  >
                    {df.label}
                  </button>
                ))}
              </div>

              {/* Menu Items Grid */}
              {filteredMenu.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  No dishes found matching this filter.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                  {filteredMenu.map((item) => {
                    const spice = getSpiceInfo(item);
                    const isChef = isChefSpecial(item);
                    const qty = preOrderCart[item.id]?.qty || 0;

                    return (
                      <div
                        key={item.id}
                        style={{
                          border: `1.5px solid ${qty > 0 ? "var(--primary)" : "var(--border)"}`,
                          borderRadius: "var(--radius-lg)",
                          padding: "1rem",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          backgroundColor: qty > 0 ? "var(--primary-light)" : "var(--bg-card)",
                          transition: "var(--transition)",
                          boxShadow: qty > 0 ? "0 4px 12px rgba(224,90,27,0.15)" : "var(--shadow-sm)"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.4rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                              {/* Veg / Non-Veg Indicator */}
                              <span style={{
                                width: "14px",
                                height: "14px",
                                borderRadius: "2px",
                                border: `2px solid ${item.is_vegetarian ? "#10B981" : "#EF4444"}`,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0
                              }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: item.is_vegetarian ? "#10B981" : "#EF4444" }} />
                              </span>
                              <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-main)" }}>{item.name}</span>
                            </div>
                            <span style={{ fontWeight: 900, color: "var(--primary)", fontSize: "1.05rem", whiteSpace: "nowrap" }}>
                              ₹{item.price}
                            </span>
                          </div>

                          {/* Badges: Spice Meter & Chef Signature */}
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                            <span style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: spice.color,
                              backgroundColor: spice.bg,
                              padding: "0.15rem 0.45rem",
                              borderRadius: "4px"
                            }}>
                              {spice.icon} {spice.label}
                            </span>

                            {isChef && (
                              <span style={{
                                fontSize: "0.68rem",
                                fontWeight: 800,
                                color: "#92400E",
                                backgroundColor: "#FEF3C7",
                                padding: "0.15rem 0.45rem",
                                borderRadius: "4px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.2rem"
                              }}>
                                <Sparkles size={11} style={{ color: "#F59E0B" }} />
                                <span>Chef's Choice</span>
                              </span>
                            )}
                          </div>

                          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "0.75rem" }}>
                            {item.description || "Freshly cooked to authentic heritage recipe."}
                          </p>
                        </div>

                        {/* Pre-Order Quantity Controls */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "0.5rem", borderTop: "1px dashed var(--border)" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>
                            Dine-In Pre-Order:
                          </span>

                          {qty === 0 ? (
                            <button
                              onClick={() => handleAddPreOrder(item)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                padding: "0.35rem 0.75rem",
                                borderRadius: "6px",
                                backgroundColor: "var(--bg-card)",
                                border: "1.5px solid var(--primary)",
                                color: "var(--primary)",
                                fontSize: "0.78rem",
                                fontWeight: 800,
                                transition: "var(--transition)"
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "var(--primary)"; e.currentTarget.style.color = "#FFFFFF"; }}
                              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-card)"; e.currentTarget.style.color = "var(--primary)"; }}
                            >
                              <Plus size={13} />
                              <span>PRE-ORDER</span>
                            </button>
                          ) : (
                            <div style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              backgroundColor: "var(--primary)",
                              color: "#FFFFFF",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "6px"
                            }}>
                              <button
                                onClick={() => handleRemovePreOrder(item)}
                                style={{ color: "#FFFFFF", display: "flex", alignItems: "center" }}
                              >
                                <Minus size={14} />
                              </button>
                              <span style={{ fontWeight: 900, fontSize: "0.85rem", minWidth: "16px", textAlign: "center" }}>
                                {qty}
                              </span>
                              <button
                                onClick={() => handleAddPreOrder(item)}
                                style={{ color: "#FFFFFF", display: "flex", alignItems: "center" }}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Verified Reviews Section */}
            <div style={{
              backgroundColor: "var(--bg-card)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-sm)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <ShieldCheck size={18} style={{ color: "var(--secondary)" }} />
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Verified Diner Reviews</h3>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Only diners with 6-digit server-verified check-ins can leave reviews
                  </p>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  backgroundColor: "#FEF3C7",
                  padding: "0.4rem 0.85rem",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 900,
                  fontSize: "1.1rem",
                  color: "#92400E"
                }}>
                  <Star size={18} style={{ fill: "#F59E0B", color: "#F59E0B" }} />
                  <span>{restaurant.rating} / 5.0</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No reviews written yet. Check in to be the first!</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      style={{
                        padding: "1rem",
                        backgroundColor: "var(--bg-main)",
                        borderRadius: "var(--radius-lg)",
                        border: "1px solid var(--border)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>{rev.customer_name}</span>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.2rem",
                            fontSize: "0.68rem",
                            color: "var(--secondary)",
                            fontWeight: 700,
                            backgroundColor: "var(--secondary-light)",
                            padding: "0.1rem 0.4rem",
                            borderRadius: "4px"
                          }}>
                            <CheckCircle2 size={11} />
                            Verified Diner
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              style={{
                                fill: i < rev.rating ? "#F59E0B" : "none",
                                color: i < rev.rating ? "#F59E0B" : "#CBD5E1"
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-main)", lineHeight: 1.5 }}>
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Quick Booking Box, Map, Complaints */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", position: "sticky", top: "90px" }}>
            {/* Quick Reservation Box */}
            <div style={{
              backgroundColor: "var(--bg-card)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-md)"
            }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 900, marginBottom: "0.35rem" }}>
                Book Your Table
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Instant confirmation • Earn +10 Loyalty Points on check-in
              </p>

              {/* Pre-order summary card in right column if selected */}
              {preOrderCount > 0 && (
                <div style={{
                  backgroundColor: "var(--primary-light)",
                  border: "1px solid var(--primary)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem",
                  marginBottom: "1rem",
                  fontSize: "0.82rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "var(--primary)", marginBottom: "0.3rem" }}>
                    <span>🍲 Pre-Ordered Dishes ({preOrderCount})</span>
                    <span>₹{preOrderTotal}</span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Ready at your table upon arrival
                  </div>
                </div>
              )}

              <button
                onClick={() => onBook(restaurant, preOrderItemsList)}
                className="btn btn-primary"
                style={{ width: "100%", padding: "0.85rem", fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.75rem" }}
              >
                <Utensils size={16} />
                <span>{preOrderCount > 0 ? `BOOK WITH PRE-ORDER (₹${preOrderTotal})` : "SELECT DATE & TIME"}</span>
              </button>

              <button
                onClick={() => onOpenWaitlist(restaurant)}
                className="btn btn-secondary"
                style={{ width: "100%", padding: "0.75rem", fontSize: "0.85rem", fontWeight: 700 }}
              >
                <Users size={15} />
                <span>JOIN LIVE WAITLIST</span>
              </button>
            </div>

            {/* Embedded Interactive Route Map */}
            <div>
              <InteractiveMap
                restaurants={[restaurant]}
                selectedRestaurant={restaurant}
                onSelectRestaurant={() => {}}
              />
            </div>

            {/* Support / Grievance CTA */}
            <div style={{
              backgroundColor: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "var(--radius-lg)",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertTriangle size={18} style={{ color: "var(--danger)" }} />
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--danger)" }}>
                  Have an issue with this restaurant?
                </span>
              </div>
              <button
                onClick={() => onOpenFileComplaint(restaurant)}
                style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--danger)", textDecoration: "underline" }}
              >
                File Grievance
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Sticky Pre-Order Tray at Bottom (Feature 4) */}
      {preOrderCount > 0 && (
        <div style={{
          position: "fixed",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          width: "90%",
          maxWidth: "750px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          border: "2px solid var(--primary)",
          boxShadow: "0 10px 35px rgba(224, 90, 27, 0.35)",
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          animation: "modalPop 0.3s ease-out"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              backgroundColor: "var(--primary)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: "1rem", color: "var(--text-main)" }}>
                {preOrderCount} Dine-In {preOrderCount === 1 ? "Dish" : "Dishes"} Pre-Ordered
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>Estimated Pre-Order Total:</span>
                <strong style={{ color: "var(--primary)", fontSize: "0.95rem" }}>₹{preOrderTotal}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <button
              onClick={() => setPreOrderCart({})}
              className="btn btn-secondary btn-sm"
              title="Clear all pre-orders"
              style={{ padding: "0.5rem 0.75rem", fontSize: "0.78rem" }}
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>

            <button
              onClick={() => onBook(restaurant, preOrderItemsList)}
              className="btn btn-primary"
              style={{
                padding: "0.65rem 1.25rem",
                fontWeight: 800,
                fontSize: "0.9rem",
                borderRadius: "var(--radius-lg)"
              }}
            >
              <Utensils size={15} />
              <span>Reserve Table with Pre-Order</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}