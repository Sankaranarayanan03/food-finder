import { useState, useEffect, useCallback } from "react";
import { 
  Sparkles, Send, X, Star, 
  ArrowRight, Utensils
} from "lucide-react";
import { api } from "../services/api";

export function AIRecommenderModal({ initialQuery = "", onClose, onSelectRestaurant, onBookRestaurant }) {
  const [query, setQuery] = useState(initialQuery || "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const SAMPLE_QUERIES = [
    "Vegetarian restaurant in Coimbatore under ₹500 with parking and an available table",
    "Spicy Chettinad Biryani in Madurai with high rating",
    "Filter Coffee & Tiffin in Chennai near me",
    "Family dining in Salem with 4+ rating"
  ];

  const handleAISearch = useCallback(async (searchPrompt) => {
    const q = searchPrompt || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.getAIRecommendations(q);
      setResults(data);
    } catch (err) {
      setError(err.message || "Failed to fetch AI recommendations.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Run automatically on open if initial query supplied
  useEffect(() => {
    let ignore = false;
    if (initialQuery) {
      Promise.resolve().then(() => {
        if (!ignore) handleAISearch(initialQuery);
      });
    }
    return () => { ignore = true; };
  }, [initialQuery, handleAISearch]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "750px", padding: "2rem" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0E5E4E 0%, #10B981 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF"
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--text-main)" }}>
                AI Restaurant Matcher (Tamil Nadu)
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Natural-language discovery parsing intent, cuisine, budget, live seats & parking
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)", padding: "0.25rem" }}>
            <X size={22} />
          </button>
        </div>

        {/* Input Bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          backgroundColor: "#F1F5F9",
          padding: "0.6rem 0.85rem",
          borderRadius: "var(--radius-lg)",
          marginBottom: "1rem",
          border: "1.5px solid var(--border)"
        }}>
          <input
            type="text"
            placeholder="Type anything (e.g. Vegetarian in Coimbatore under ₹500 with parking)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "var(--text-main)"
            }}
          />
          <button
            onClick={() => handleAISearch()}
            disabled={loading}
            className="btn btn-primary"
            style={{
              padding: "0.55rem 1rem",
              borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, #0E5E4E 0%, #10B981 100%)"
            }}
          >
            <Send size={15} />
            <span>{loading ? "ANALYZING..." : "FIND"}</span>
          </button>
        </div>

        {/* Sample Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.5rem" }}>
          {SAMPLE_QUERIES.map((s, idx) => (
            <button
              key={idx}
              onClick={() => { setQuery(s); handleAISearch(s); }}
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.6rem",
                borderRadius: "var(--radius-full)",
                backgroundColor: "#F8FAFC",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                fontWeight: 600
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "var(--primary-light)"; e.currentTarget.style.color = "var(--primary)"; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "#F8FAFC"; e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: "var(--danger-bg)",
            color: "var(--danger)",
            padding: "0.75rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            marginBottom: "1rem"
          }}>
            {error}
          </div>
        )}

        {/* AI Results */}
        {results && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Parsed Intent Badges */}
            <div style={{
              backgroundColor: "#F8FAFC",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
              marginBottom: "1.25rem",
              border: "1px solid var(--border)"
            }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                AI PARSED INTENT:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {results.parsed_intent.city && (
                  <span className="badge badge-primary">City: {results.parsed_intent.city}</span>
                )}
                {results.parsed_intent.cuisine && (
                  <span className="badge badge-verified">Cuisine: {results.parsed_intent.cuisine}</span>
                )}
                {results.parsed_intent.max_budget && (
                  <span className="badge" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>Budget: ≤ ₹{results.parsed_intent.max_budget}</span>
                )}
                {results.parsed_intent.req_parking && (
                  <span className="badge" style={{ backgroundColor: "#DEF7EC", color: "#03543F" }}>Req: Parking Available</span>
                )}
                {results.parsed_intent.req_table && (
                  <span className="badge" style={{ backgroundColor: "#DEF7EC", color: "#03543F" }}>Req: Available Table</span>
                )}
              </div>
            </div>

            {/* Best Match Card */}
            {results.best_match ? (
              <div style={{
                border: "2px solid var(--primary)",
                borderRadius: "var(--radius-xl)",
                padding: "1.25rem",
                backgroundColor: "var(--bg-card)",
                boxShadow: "var(--shadow-lg)",
                marginBottom: "1.5rem",
                position: "relative"
              }}>
                <div style={{
                  position: "absolute",
                  top: "-12px",
                  left: "20px",
                  backgroundColor: "var(--primary)",
                  color: "#FFFFFF",
                  padding: "0.2rem 0.85rem",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}>
                  <Sparkles size={12} />
                  <span>AI BEST MATCH</span>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                  <img
                    src={results.best_match.image_url}
                    alt={results.best_match.name}
                    style={{ width: "120px", height: "100px", borderRadius: "var(--radius-md)", objectFit: "cover" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 900 }}>{results.best_match.name}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#F59E0B", fontWeight: 800 }}>
                        <Star size={15} style={{ fill: "#F59E0B" }} />
                        <span>{results.best_match.rating}</span>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0.2rem 0" }}>
                      {results.best_match.city} • {results.best_match.cuisine} • Avg ₹{results.best_match.avg_cost_for_two} for two
                    </div>

                    {/* AI Recommendation Reason */}
                    <div style={{
                      backgroundColor: "var(--primary-light)",
                      color: "var(--primary)",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      marginTop: "0.5rem"
                    }}>
                      {results.recommendation_reason}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                  <button
                    onClick={() => { onClose(); onSelectRestaurant(results.best_match); }}
                    className="btn btn-secondary btn-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => { onClose(); onBookRestaurant(results.best_match); }}
                    className="btn btn-primary btn-sm"
                  >
                    <Utensils size={14} />
                    <span>Book This Table</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Smart Alternatives */}
            {results.alternatives?.length > 0 && (
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem" }}>
                  SMART NEARBY ALTERNATIVES
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {results.alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        backgroundColor: "var(--bg-main)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border)"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{alt.restaurant.name}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          {alt.restaurant.city} • {alt.restaurant.cuisine} • {alt.match_reason}
                        </div>
                      </div>
                      <button
                        onClick={() => { onClose(); onSelectRestaurant(alt.restaurant); }}
                        className="btn btn-secondary btn-sm"
                      >
                        <span>View</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}