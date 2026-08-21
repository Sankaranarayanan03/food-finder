import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Store, ShieldCheck, CheckCircle2, Search, X, ChevronDown
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { CheckInModal } from "../components/CheckInModal";

export function OwnerDashboardPage() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestId, setSelectedRestId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [restSearchQuery, setRestSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadDashboard = useCallback(async (restId) => {
    try {
      const data = await api.getOwnerDashboard(restId);
      setDashboardData(data);
    } catch (err) {
      console.error("Dashboard metric error", err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    api.getOwnerRestaurants().then(async (list) => {
      if (!ignore) {
        setRestaurants(list);
        if (list.length > 0) {
          const activeId = list[0].id;
          setSelectedRestId((prev) => prev || activeId);
          try {
            const data = await api.getOwnerDashboard(activeId);
            if (!ignore) setDashboardData(data);
          } catch (e) {
            console.error(e);
          }
        }
        setLoading(false);
      }
    }).catch((err) => {
      if (!ignore) {
        console.error("Owner load error", err);
        setLoading(false);
      }
    });
    return () => { ignore = true; };
  }, []);

  const handleStatusUpdate = async (updateFields) => {
    if (!selectedRestId) return;
    try {
      await api.updateRestaurantStatus(selectedRestId, updateFields);
      await loadDashboard(selectedRestId);
      setStatusMsg("Real-time availability broadcasted successfully!");
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      alert(err.message || "Failed to update status.");
    }
  };

  const filteredRestaurants = restaurants.filter((r) => {
    if (!restSearchQuery.trim()) return true;
    const q = restSearchQuery.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.city?.toLowerCase().includes(q) ||
      r.cuisine?.toLowerCase().includes(q)
    );
  });

  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestId);

  if (loading) {
    return (
      <div className="container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Loading Restaurant Owner Portal...</p>
      </div>
    );
  }

  const rest = dashboardData?.restaurant;
  const stats = dashboardData?.stats;

  return (
    <div style={{ padding: "2rem 0 4rem 0", backgroundColor: "var(--bg-main)", minHeight: "85vh" }}>
      <div className="container">
        {/* Top Control Bar */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
          padding: "1.5rem",
          boxShadow: "var(--shadow-md)",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "var(--primary)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Store size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 900 }}>
                  Owner Operations Portal
                </h1>
                <span className="badge badge-primary">LIVE DESK</span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Logged in as: <strong>{user?.full_name}</strong>
              </p>
            </div>
          </div>

          {/* Actions: Single Search Autocomplete Bar & Check-in Terminal Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {restaurants.length > 0 && (
              <div ref={dropdownRef} style={{ position: "relative", minWidth: "300px", maxWidth: "420px" }}>
                {/* Unified Search Input */}
                <div style={{ position: "relative" }}>
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--primary)",
                      pointerEvents: "none"
                    }}
                  />
                  <input
                    type="text"
                    placeholder={selectedRestaurant ? `${selectedRestaurant.name} — ${selectedRestaurant.city}` : `Search ${restaurants.length} restaurants...`}
                    value={restSearchQuery}
                    onChange={(e) => {
                      setRestSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 2.2rem 0.65rem 2.4rem",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      backgroundColor: "var(--bg-main)",
                      color: "var(--text-main)",
                      border: "1.5px solid var(--primary)",
                      boxShadow: isDropdownOpen ? "0 0 0 3px var(--primary-light)" : "none",
                      outline: "none"
                    }}
                  />
                  {restSearchQuery ? (
                    <X
                      size={16}
                      onClick={() => {
                        setRestSearchQuery("");
                        setIsDropdownOpen(true);
                      }}
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        color: "var(--text-muted)"
                      }}
                    />
                  ) : (
                    <ChevronDown
                      size={16}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        color: "var(--primary)"
                      }}
                    />
                  )}
                </div>

                {/* Floating Autocomplete Suggestions Panel */}
                {isDropdownOpen && (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.5)",
                    maxHeight: "300px",
                    overflowY: "auto",
                    zIndex: 1000
                  }}>
                    <div style={{
                      padding: "0.4rem 0.75rem",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      color: "var(--text-muted)",
                      backgroundColor: "var(--bg-main)",
                      borderBottom: "1px solid var(--border)",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase"
                    }}>
                      {restSearchQuery ? `Matches for "${restSearchQuery}" (${filteredRestaurants.length})` : `All Tamil Nadu Restaurants (${restaurants.length})`}
                    </div>

                    {filteredRestaurants.length === 0 ? (
                      <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        No spots matching "<strong>{restSearchQuery}</strong>"
                      </div>
                    ) : (
                      filteredRestaurants.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => {
                            setSelectedRestId(r.id);
                            loadDashboard(r.id);
                            setRestSearchQuery("");
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            padding: "0.7rem 0.9rem",
                            cursor: "pointer",
                            borderBottom: "1px solid var(--border)",
                            backgroundColor: selectedRestId === r.id ? "var(--primary-light)" : "transparent",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            transition: "background-color 0.15s ease"
                          }}
                          onMouseOver={(e) => {
                            if (selectedRestId !== r.id) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                          }}
                          onMouseOut={(e) => {
                            if (selectedRestId !== r.id) e.currentTarget.style.backgroundColor = selectedRestId === r.id ? "var(--primary-light)" : "transparent";
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "0.88rem", color: selectedRestId === r.id ? "var(--primary)" : "var(--text-main)" }}>
                              {r.name}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                              📍 {r.city} • <span style={{ color: "var(--primary)" }}>{r.cuisine}</span>
                            </div>
                          </div>
                          {selectedRestId === r.id && (
                            <CheckCircle2 size={16} style={{ color: "var(--primary)", flexShrink: 0 }} />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setShowCheckInModal(true)}
              className="btn btn-primary"
              style={{
                fontWeight: 800,
                background: "linear-gradient(135deg, #0E5E4E 0%, #10B981 100%)",
                boxShadow: "0 4px 12px rgba(14, 94, 78, 0.3)"
              }}
            >
              <ShieldCheck size={18} />
              <span>6-DIGIT CHECK-IN TERMINAL</span>
            </button>
          </div>
        </div>

        {statusMsg && (
          <div style={{
            backgroundColor: "#DEF7EC",
            color: "#03543F",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            fontWeight: 700,
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <CheckCircle2 size={16} />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Real-time Status Control Center Card */}
        {rest && (
          <div style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            padding: "1.75rem",
            boxShadow: "var(--shadow-md)",
            marginBottom: "2rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 900 }}>
                  Real-Time Availability Controller
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Changes broadcast instantly to customer apps without page refresh
                </p>
              </div>
              <span className="badge badge-verified">
                Target: {rest.name}
              </span>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.25rem"
            }}>
              {/* 1. Open / Closed Status */}
              <div style={{ backgroundColor: "var(--bg-main)", padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                  OPENING STATUS
                </div>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    onClick={() => handleStatusUpdate({ is_open: true })}
                    className="btn btn-sm"
                    style={{
                      flex: 1,
                      backgroundColor: rest.is_open ? "var(--secondary)" : "var(--border)",
                      color: rest.is_open ? "#FFFFFF" : "var(--text-muted)",
                      fontWeight: 800
                    }}
                  >
                    OPEN
                  </button>
                  <button
                    onClick={() => handleStatusUpdate({ is_open: false })}
                    className="btn btn-sm"
                    style={{
                      flex: 1,
                      backgroundColor: !rest.is_open ? "var(--danger)" : "var(--border)",
                      color: !rest.is_open ? "#FFFFFF" : "var(--text-muted)",
                      fontWeight: 800
                    }}
                  >
                    CLOSED
                  </button>
                </div>
              </div>

              {/* 2. Table Status */}
              <div style={{ backgroundColor: "var(--bg-main)", padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                  TABLE AVAILABILITY
                </div>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {["AVAILABLE", "LIMITED", "FULL"].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusUpdate({ table_status: st })}
                      className="btn btn-sm"
                      style={{
                        flex: 1,
                        padding: "0.35rem 0.2rem",
                        fontSize: "0.72rem",
                        backgroundColor: rest.table_status === st ? "var(--primary)" : "var(--border)",
                        color: rest.table_status === st ? "#FFFFFF" : "var(--text-muted)",
                        fontWeight: 800
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Parking Status */}
              <div style={{ backgroundColor: "var(--bg-main)", padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                  PARKING STATUS
                </div>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {["AVAILABLE", "LIMITED", "FULL"].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusUpdate({ parking_status: st })}
                      className="btn btn-sm"
                      style={{
                        flex: 1,
                        padding: "0.35rem 0.2rem",
                        fontSize: "0.72rem",
                        backgroundColor: rest.parking_status === st ? "var(--secondary)" : "var(--border)",
                        color: rest.parking_status === st ? "#FFFFFF" : "var(--text-muted)",
                        fontWeight: 800
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Waiting Time (5, 10, 20+ mins) */}
              <div style={{ backgroundColor: "var(--bg-main)", padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                  CURRENT WAIT TIME
                </div>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {[0, 5, 10, 20].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handleStatusUpdate({ wait_time_mins: mins })}
                      className="btn btn-sm"
                      style={{
                        flex: 1,
                        fontSize: "0.75rem",
                        backgroundColor: rest.wait_time_mins === mins ? "var(--accent)" : "var(--border)",
                        color: rest.wait_time_mins === mins ? "#FFFFFF" : "var(--text-muted)",
                        fontWeight: 800
                      }}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Metrics Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem"
        }}>
          <div style={{ backgroundColor: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>TOTAL RESERVATIONS</div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "var(--text-main)", marginTop: "0.2rem" }}>
              {stats?.total_bookings || 0}
            </div>
          </div>

          <div style={{ backgroundColor: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>CONFIRMED (AWAITING CHECK-IN)</div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "var(--primary)", marginTop: "0.2rem" }}>
              {stats?.active_confirmed || 0}
            </div>
          </div>

          <div style={{ backgroundColor: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>CHECKED-IN GUESTS</div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "var(--secondary)", marginTop: "0.2rem" }}>
              {stats?.checked_in_visits || 0}
            </div>
          </div>

          <div style={{ backgroundColor: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>LOYALTY POINTS AWARDED</div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "var(--accent)", marginTop: "0.2rem" }}>
              {stats?.loyalty_points_awarded || 0} pts
            </div>
          </div>
        </div>

        {/* Section 2.4: Inline Owner Check-In Desk */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          border: "2px solid var(--secondary)",
          padding: "1.5rem",
          boxShadow: "var(--shadow-md)",
          marginBottom: "2rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <ShieldCheck size={22} style={{ color: "var(--secondary)" }} />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--text-main)" }}>
              RESTAURANT CHECK-IN DESK — {rest?.name}
            </h2>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Enter the customer's 6-digit verification code to confirm physical arrival, mark status as CHECKED_IN, and issue +10 Loyalty Points.
          </p>

          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const codeVal = e.target.elements.checkin_code.value.trim();
              if (!codeVal || codeVal.length < 6) return;
              try {
                const res = await api.verifyCheckInCode(codeVal);
                setStatusMsg(`✓ ${res.customer_name} verified! ${res.message} (+${res.points_awarded} pts)`);
                e.target.reset();
                if (selectedRestId) loadDashboard(selectedRestId);
              } catch (err) {
                alert(err.message || "Invalid verification code.");
              }
            }}
            style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}
          >
            <input
              name="checkin_code"
              type="text"
              maxLength={6}
              placeholder="Enter 6-Digit Code"
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-md)",
                fontSize: "1.2rem",
                fontWeight: 900,
                letterSpacing: "0.2em",
                fontFamily: "monospace",
                width: "220px",
                border: "2px solid var(--border)"
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: "0.75rem 1.5rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #0E5E4E 0%, #10B981 100%)"
              }}
            >
              <ShieldCheck size={18} />
              <span>VERIFY CUSTOMER</span>
            </button>
          </form>
        </div>

        {/* Section 2.7: Today's Check-Ins Table */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
          padding: "1.5rem",
          boxShadow: "var(--shadow-sm)",
          marginBottom: "2rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 900 }}>
              Today's Check-Ins ({rest?.name})
            </h2>
            <span className="badge badge-verified">
              {dashboardData?.today_checkins?.length || 0} Guests Scheduled Today
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={{ padding: "0.75rem" }}>Customer Name</th>
                  <th style={{ padding: "0.75rem" }}>Booking ID</th>
                  <th style={{ padding: "0.75rem" }}>Time</th>
                  <th style={{ padding: "0.75rem" }}>Guests</th>
                  <th style={{ padding: "0.75rem" }}>Verification Status</th>
                  <th style={{ padding: "0.75rem" }}>Check-In Time</th>
                </tr>
              </thead>
              <tbody>
                {(!dashboardData?.today_checkins || dashboardData.today_checkins.length === 0) ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                      No check-ins recorded for today yet.
                    </td>
                  </tr>
                ) : (
                  dashboardData.today_checkins.map((tc, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "0.75rem", fontWeight: 700 }}>{tc.customer_name}</td>
                      <td style={{ padding: "0.75rem", fontWeight: 700, color: "var(--primary)", fontFamily: "monospace" }}>{tc.booking_ref}</td>
                      <td style={{ padding: "0.75rem" }}>{tc.booking_time}</td>
                      <td style={{ padding: "0.75rem" }}>{tc.guest_count} Persons</td>
                      <td style={{ padding: "0.75rem" }}>
                        <span className={`badge ${tc.verification_status === "VERIFIED" || tc.status === "CHECKED_IN" ? "badge-available" : "badge-limited"}`}>
                          {tc.verification_status === "VERIFIED" || tc.status === "CHECKED_IN" ? "✓ VERIFIED" : "PENDING"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem", color: tc.check_in_time ? "var(--secondary)" : "var(--text-muted)", fontWeight: 600 }}>
                        {tc.check_in_time ? new Date(tc.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Not checked in"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Reservation Stream */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
          padding: "1.5rem",
          boxShadow: "var(--shadow-sm)"
        }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: "1rem" }}>
            Recent Reservation Stream
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={{ padding: "0.75rem" }}>Booking Ref</th>
                  <th style={{ padding: "0.75rem" }}>Guest Name</th>
                  <th style={{ padding: "0.75rem" }}>Party</th>
                  <th style={{ padding: "0.75rem" }}>Slot</th>
                  <th style={{ padding: "0.75rem" }}>Table</th>
                  <th style={{ padding: "0.75rem" }}>6-Digit Code</th>
                  <th style={{ padding: "0.75rem" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.recent_bookings?.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: "var(--primary)" }}>{b.booking_ref}</td>
                    <td style={{ padding: "0.75rem", fontWeight: 600 }}>{b.customer_name}</td>
                    <td style={{ padding: "0.75rem" }}>{b.guest_count} Guests</td>
                    <td style={{ padding: "0.75rem" }}>{b.booking_date} {b.booking_time}</td>
                    <td style={{ padding: "0.75rem" }}>{b.table_number}</td>
                    <td style={{ padding: "0.75rem", fontFamily: "monospace", fontWeight: 800 }}>{b.verification_code}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span className={`badge ${b.status === "CHECKED_IN" ? "badge-available" : "badge-limited"}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Check-In Modal */}
        {showCheckInModal && (
          <CheckInModal
            onClose={() => setShowCheckInModal(false)}
            onCheckInSuccess={() => {
              loadDashboard(selectedRestId);
            }}
          />
        )}
      </div>
    </div>
  );
}