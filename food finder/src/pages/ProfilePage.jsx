import { useState, useEffect, useCallback } from "react";
import { 
  Award, ShieldCheck, Calendar, Clock, MapPin, 
  Star, MessageSquare, Copy, History
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { LoyaltyDashboard } from "../components/LoyaltyDashboard";
import { shareBookingToWhatsApp } from "../utils/whatsapp";

export function ProfilePage({ onSelectRestaurant, onWriteReview, onBookRestaurant, recentlyViewed = [] }) {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState("bookings"); // 'bookings', 'loyalty', 'frequent', 'favorites', 'complaints'
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [prof, bList, cList] = await Promise.all([
        api.getProfile(),
        api.getMyBookings(),
        api.getMyComplaints()
      ]);
      setProfileData(prof);
      setBookings(bList);
      setComplaints(cList);
    } catch (err) {
      console.error("Profile load error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      api.getProfile(),
      api.getMyBookings(),
      api.getMyComplaints()
    ]).then(([prof, bList, cList]) => {
      if (!ignore) {
        setProfileData(prof);
        setBookings(bList);
        setComplaints(cList);
        setLoading(false);
      }
    }).catch((err) => {
      if (!ignore) {
        console.error("Profile load error", err);
        setLoading(false);
      }
    });
    return () => { ignore = true; };
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      await api.cancelBooking(bookingId);
      await loadData();
    } catch (e) {
      alert(e.message || "Could not cancel reservation.");
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleShareWhatsApp = (booking) => {
    const inputPhone = window.prompt(
      "Enter WhatsApp mobile number to share your 6-digit check-in code:",
      user?.phone || ""
    );
    if (inputPhone !== null) {
      shareBookingToWhatsApp(booking, booking.restaurant_name, inputPhone);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Loading your diner profile & reservations...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem 0 4rem 0", backgroundColor: "var(--bg-main)", minHeight: "85vh" }}>
      <div className="container">
        {/* Profile Header Card */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
          padding: "2rem",
          boxShadow: "var(--shadow-md)",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.5rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              backgroundColor: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
              fontWeight: 900
            }}>
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 900 }}>{user?.full_name}</h1>
                <span className="badge badge-verified" style={{ fontSize: "0.72rem" }}>
                  Verified TN Diner
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {user?.email} • {user?.phone || "+91 94440 98765"}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <div style={{ textAlign: "center", backgroundColor: "#FEF6E6", padding: "0.75rem 1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid #FDE68A" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", color: "var(--accent)" }}>
                <Award size={18} />
                <span style={{ fontSize: "1.4rem", fontWeight: 900 }}>{profileData?.stats?.loyalty_points || 0}</span>
              </div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#92400E" }}>LOYALTY REWARDS</div>
            </div>

            <div style={{ textAlign: "center", backgroundColor: "#DEF7EC", padding: "0.75rem 1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid #A7F3D0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", color: "var(--secondary)" }}>
                <ShieldCheck size={18} />
                <span style={{ fontSize: "1.4rem", fontWeight: 900 }}>{profileData?.stats?.verified_visits || 0}</span>
              </div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#065F46" }}>VERIFIED VISITS</div>
            </div>
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "2px solid var(--border)",
          marginBottom: "1.75rem",
          overflowX: "auto"
        }}>
          {[
            { key: "bookings", label: `My Reservations (${bookings.length})` },
            { key: "loyalty", label: "🏆 Loyalty & Rewards" },
            { key: "recently_viewed", label: `🕐 Recently Viewed (${recentlyViewed.length})` },
            { key: "frequent", label: `Frequent Places (${profileData?.frequent_visits?.length || 0})` },
            { key: "favorites", label: `Favorites (${profileData?.favorites?.length || 0})` },
            { key: "complaints", label: `Grievances (${complaints.length})` }
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: "0.75rem 1.25rem",
                fontWeight: 700,
                fontSize: "0.9rem",
                color: activeTab === t.key ? "var(--primary)" : "var(--text-muted)",
                borderBottom: activeTab === t.key ? "3px solid var(--primary)" : "3px solid transparent",
                marginBottom: "-2px",
                whiteSpace: "nowrap"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Loyalty Dashboard (Feature 6) */}
        {activeTab === "loyalty" && <LoyaltyDashboard />}

        {/* Tab: Recently Viewed (Feature 7) */}
        {activeTab === "recently_viewed" && (
          <div>
            {recentlyViewed.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-xl)" }}>
                <History size={40} style={{ color: "var(--text-muted)", marginBottom: "0.75rem" }} />
                <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>No restaurants viewed yet. Start exploring!</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {recentlyViewed.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onSelectRestaurant(r)}
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--border)",
                      overflow: "hidden",
                      cursor: "pointer",
                      boxShadow: "var(--shadow-sm)",
                      transition: "var(--transition)"
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-3px)", e.currentTarget.style.boxShadow = "var(--shadow-lg)")}
                    onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "var(--shadow-sm)")}
                  >
                    <div style={{ height: "130px", overflow: "hidden", backgroundColor: "#E2E8F0" }}>
                      <img src={r.image_url || "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80"} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: "0.85rem" }}>
                      <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: "0.2rem" }}>{r.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.4rem" }}>
                        <MapPin size={11} style={{ color: "var(--primary)" }} />
                        <span>{r.city} • {r.cuisine}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                        <Star size={12} style={{ fill: "#F59E0B", color: "#F59E0B" }} />
                        <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{r.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Bookings */}
        {activeTab === "bookings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {bookings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-xl)" }}>
                <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>No reservations found.</p>
              </div>
            ) : (
              bookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "var(--radius-xl)",
                    border: "1px solid var(--border)",
                    padding: "1.5rem",
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1.25rem"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>{b.restaurant_name}</h3>
                      {b.status === "CHECKED_IN" ? (
                        <span className="badge badge-available" style={{ fontWeight: 800 }}>
                          Status: ✓ Checked-In · Verification: Verified · Loyalty Points: +10
                        </span>
                      ) : (
                        <span className={`badge ${b.status === "CANCELLED" ? "badge-full" : "badge-limited"}`}>
                          Status: {b.status} · Verification: PENDING
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
                      <span style={{ fontWeight: 700, color: "var(--primary)" }}>Ref: {b.booking_ref}</span> • {b.restaurant_city} • Table: {b.table_number || "Auto"}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.85rem", color: "var(--text-main)", fontWeight: 600 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Calendar size={15} style={{ color: "var(--primary)" }} />
                        {b.booking_date}
                      </span>
                      <span>•</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Clock size={15} style={{ color: "var(--accent)" }} />
                        {b.booking_time}
                      </span>
                      <span>•</span>
                      <span>{b.guest_count} Guests</span>
                    </div>
                  </div>

                  {/* 6-Digit Check-in Code Card */}
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{
                      backgroundColor: "rgba(224, 90, 27, 0.1)",
                      border: "1px dashed var(--primary)",
                      padding: "0.65rem 1rem",
                      borderRadius: "var(--radius-md)",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--primary)" }}>6-DIGIT CHECK-IN CODE</div>
                      <div style={{ fontFamily: "monospace", fontSize: "1.4rem", fontWeight: 900, letterSpacing: "0.15em", color: "var(--text-main)" }}>
                        {b.verification_code}
                      </div>
                      <button
                        onClick={() => copyCode(b.verification_code)}
                        style={{ fontSize: "0.68rem", color: "var(--primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.2rem", margin: "0 auto" }}
                      >
                        <Copy size={11} />
                        <span>{copiedCode === b.verification_code ? "COPIED" : "COPY"}</span>
                      </button>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <button
                        onClick={() => handleShareWhatsApp(b)}
                        className="btn btn-sm"
                        style={{
                          backgroundColor: "#25D366",
                          color: "#FFFFFF",
                          border: "none",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem"
                        }}
                      >
                        <MessageSquare size={14} />
                        <span>Share on WhatsApp</span>
                      </button>

                      {b.status === "CHECKED_IN" && (
                        <button
                          onClick={() => onWriteReview?.(b, { id: b.restaurant_id, name: b.restaurant_name })}
                          className="btn btn-primary btn-sm"
                          style={{ fontWeight: 700 }}
                        >
                          <Star size={14} />
                          <span>Leave Verified Review</span>
                        </button>
                      )}

                      {b.status === "CONFIRMED" && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: "var(--danger)", borderColor: "#FCA5A5" }}
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Frequent Visitor Tracking */}
        {activeTab === "frequent" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {profileData?.frequent_visits?.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No verified visits recorded yet.</p>
            ) : (
              profileData?.frequent_visits?.map((f) => (
                <div
                  key={f.restaurant_id}
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "var(--radius-xl)",
                    border: "1px solid var(--border)",
                    padding: "1.5rem",
                    boxShadow: "var(--shadow-sm)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>{f.restaurant_name}</h3>
                    <span className="badge badge-verified" style={{ fontWeight: 800 }}>
                      {f.visit_count} Verified Visits
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                    {f.city}
                  </p>
                  <button
                    onClick={() => onSelectRestaurant({ id: f.restaurant_id, name: f.restaurant_name })}
                    className="btn btn-secondary btn-sm"
                    style={{ width: "100%" }}
                  >
                    View Restaurant
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Favorites */}
        {activeTab === "favorites" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {profileData?.favorites?.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No favorite restaurants saved yet.</p>
            ) : (
              profileData?.favorites?.map((fav) => (
                <div
                  key={fav.id}
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "var(--radius-xl)",
                    border: "1px solid var(--border)",
                    padding: "1.25rem",
                    boxShadow: "var(--shadow-sm)"
                  }}
                >
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>{fav.name}</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.8rem" }}>
                    {fav.city} • {fav.cuisine} • {fav.rating}★
                  </p>
                  <button
                    onClick={() => onBookRestaurant ? onBookRestaurant(fav) : onSelectRestaurant(fav)}
                    className="btn btn-primary btn-sm"
                    style={{ width: "100%" }}
                  >
                    Book Table
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Complaints */}
        {activeTab === "complaints" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {complaints.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No grievances registered.</p>
            ) : (
              complaints.map((c) => (
                <div
                  key={c.id}
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "var(--radius-xl)",
                    border: "1px solid var(--border)",
                    padding: "1.5rem",
                    boxShadow: "var(--shadow-sm)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: 800, fontSize: "1rem" }}>{c.restaurant_name} — {c.complaint_type}</span>
                    <span className={`badge ${c.status === "RESOLVED" ? "badge-available" : (c.status === "RESPONDED" ? "badge-limited" : "badge-full")}`}>
                      {c.status}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-main)", marginBottom: "0.75rem" }}>
                    <strong>Your Note:</strong> {c.description}
                  </p>
                  {c.owner_response && (
                    <div style={{ backgroundColor: "var(--bg-main)", padding: "0.75rem", borderRadius: "var(--radius-md)", fontSize: "0.82rem", border: "1px solid var(--border)" }}>
                      <strong>Restaurant Response:</strong> {c.owner_response}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}