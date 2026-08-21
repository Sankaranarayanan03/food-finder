import { useState, useEffect, useCallback } from "react";
import { 
  Shield, MapPin, Utensils
} from "lucide-react";
import { api } from "../services/api";

export function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'users', 'complaints'
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [newStatus, setNewStatus] = useState("RESOLVED");

  const loadAdminData = useCallback(async () => {
    try {
      const [sData, uData, cData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminComplaints()
      ]);
      setStats(sData);
      setUsersList(uData);
      setComplaints(cData);
    } catch (err) {
      console.error("Admin load error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      api.getAdminStats(),
      api.getAdminUsers(),
      api.getAdminComplaints()
    ]).then(([sData, uData, cData]) => {
      if (!ignore) {
        setStats(sData);
        setUsersList(uData);
        setComplaints(cData);
        setLoading(false);
      }
    }).catch((err) => {
      if (!ignore) {
        console.error("Admin load error", err);
        setLoading(false);
      }
    });
    return () => { ignore = true; };
  }, []);

  const handleResolveComplaint = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    try {
      await api.updateComplaint(selectedComplaint.id, {
        admin_notes: adminNote,
        status: newStatus
      });
      setSelectedComplaint(null);
      setAdminNote("");
      await loadAdminData();
    } catch (err) {
      alert(err.message || "Failed to update complaint");
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Loading Tamil Nadu Admin Platform...</p>
      </div>
    );
  }

  const m = stats?.metrics;

  return (
    <div style={{ padding: "2rem 0 4rem 0", backgroundColor: "var(--bg-main)", minHeight: "85vh" }}>
      <div className="container">
        {/* Header */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
          padding: "1.5rem 2rem",
          boxShadow: "var(--shadow-md)",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Shield size={24} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 900 }}>Platform Administration</h1>
                <span className="badge" style={{ backgroundColor: "#EDE9FE", color: "#5B21B6" }}>SUPERADMIN</span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Statewide Restaurant & Reservation Governance
              </p>
            </div>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem"
        }}>
          <div style={{ backgroundColor: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>TOTAL RESTAURANTS</div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "var(--text-main)", marginTop: "0.2rem" }}>
              {m?.total_restaurants || 0}
            </div>
          </div>

          <div style={{ backgroundColor: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>ACTIVE CUSTOMERS</div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "var(--primary)", marginTop: "0.2rem" }}>
              {m?.total_customers || 0}
            </div>
          </div>

          <div style={{ backgroundColor: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>REGISTERED OWNERS</div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "var(--secondary)", marginTop: "0.2rem" }}>
              {m?.total_owners || 0}
            </div>
          </div>

          <div style={{ backgroundColor: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>COMPLETED VISITS</div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "var(--secondary)", marginTop: "0.2rem" }}>
              {m?.completed_visits || 0}
            </div>
          </div>

          <div style={{ backgroundColor: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>LOYALTY POINTS</div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "var(--accent)", marginTop: "0.2rem" }}>
              {m?.total_loyalty_points || 0} pts
            </div>
          </div>

          <div style={{ backgroundColor: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>PENDING GRIEVANCES</div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "var(--danger)", marginTop: "0.2rem" }}>
              {m?.pending_complaints || 0}
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "2px solid var(--border)",
          marginBottom: "1.75rem"
        }}>
          {[
            { key: "overview", label: "Regional Insights & Cities" },
            { key: "users", label: `Platform  (${usersList.length})` },
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
                marginBottom: "-2px"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {/* Top Cities */}
            <div style={{ backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: "1.5rem", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
                <MapPin size={18} style={{ color: "var(--primary)" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Top Cities by Network Presence</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {stats?.top_cities?.map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.85rem", backgroundColor: "var(--bg-main)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                    <span style={{ fontWeight: 700 }}>{c.city}</span>
                    <span className="badge badge-primary">{c.count} Restaurants</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Cuisines */}
            <div style={{ backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: "1.5rem", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
                <Utensils size={18} style={{ color: "var(--secondary)" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Top Regional Cuisines</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {stats?.top_cuisines?.map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.85rem", backgroundColor: "var(--bg-main)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                    <span style={{ fontWeight: 700 }}>{c.cuisine}</span>
                    <span className="badge badge-verified">{c.count} Establishments</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2:  */}
        {activeTab === "users" && (
          <div style={{ backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: "1.5rem", border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "1rem" }}>Registered Accounts</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={{ padding: "0.75rem" }}>Name</th>
                  <th style={{ padding: "0.75rem" }}>Email</th>
                  <th style={{ padding: "0.75rem" }}>Phone</th>
                  <th style={{ padding: "0.75rem" }}>Role</th>
                  <th style={{ padding: "0.75rem" }}>Registered</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 700 }}>{u.full_name}</td>
                    <td style={{ padding: "0.75rem" }}>{u.email}</td>
                    <td style={{ padding: "0.75rem" }}>{u.phone || "-"}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span className={`badge ${u.role === "ADMIN" ? "badge-primary" : (u.role === "RESTAURANT_OWNER" ? "badge-limited" : "badge-verified")}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", color: "var(--text-muted)" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Complaints Resolution */}
        {activeTab === "complaints" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {complaints.map((c) => (
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
                  <div>
                    <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>{c.restaurant_name}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginLeft: "0.5rem" }}>by {c.customer_name} ({c.complaint_type})</span>
                  </div>
                  <span className={`badge ${c.status === "RESOLVED" ? "badge-available" : (c.status === "RESPONDED" ? "badge-limited" : "badge-full")}`}>
                    {c.status}
                  </span>
                </div>
                
                <p style={{ fontSize: "0.88rem", color: "var(--text-main)", marginBottom: "0.75rem" }}>
                  {c.description}
                </p>

                {c.owner_response && (
                  <div style={{ backgroundColor: "var(--bg-main)", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-md)", fontSize: "0.82rem", marginBottom: "0.75rem", border: "1px solid var(--border)" }}>
                    <strong>Owner:</strong> {c.owner_response}
                  </div>
                )}

                {c.admin_notes && (
                  <div style={{ backgroundColor: "var(--indigo-light)", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-md)", fontSize: "0.82rem", marginBottom: "0.75rem", color: "var(--text-main)", border: "1px solid var(--border)" }}>
                    <strong>Admin Note:</strong> {c.admin_notes}
                  </div>
                )}

                <button
                  onClick={() => setSelectedComplaint(c)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  Resolve / Add Admin Action
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Resolution Modal */}
        {selectedComplaint && (
          <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", padding: "2rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                Resolve Grievance #{selectedComplaint.id}
              </h3>
              <form onSubmit={handleResolveComplaint}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>STATUS</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "var(--radius-md)", fontWeight: 600 }}
                  >
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="RESPONDED">RESPONDED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>ADMIN RESOLUTION NOTES</label>
                  <textarea
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Document resolution or corrective action..."
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "var(--radius-md)" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" onClick={() => setSelectedComplaint(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Save Resolution
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}