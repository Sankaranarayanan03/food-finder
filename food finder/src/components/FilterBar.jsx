import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { SearchAutocomplete } from "./SearchAutocomplete";

export function FilterBar({
  filters,
  onChange,
  onReset,
  cities = [],
  cuisines = [],
  totalCount = 0
}) {
  const RATING_OPTIONS = [
    { label: "Any Rating", val: "" },
    { label: "4.5+ ★ (Elite)", val: 4.5 },
    { label: "4.0+ ★ (Great)", val: 4.0 },
    { label: "3.5+ ★", val: 3.5 },
  ];

  return (
    <div style={{
      backgroundColor: "var(--bg-card)",
      borderRadius: "var(--radius-xl)",
      border: "1px solid var(--border)",
      padding: "1.25rem",
      boxShadow: "var(--shadow-sm)",
      marginBottom: "1.5rem"
    }}>
      {/* Top Row: Quick Count & Reset */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        paddingBottom: "0.85rem",
        marginBottom: "1rem",
        flexWrap: "wrap",
        gap: "0.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <SlidersHorizontal size={18} style={{ color: "var(--primary)" }} />
          <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-main)" }}>
            Filters & Availability
          </span>
          <span style={{
            backgroundColor: "var(--primary-light)",
            color: "var(--primary)",
            fontWeight: 700,
            fontSize: "0.75rem",
            padding: "0.15rem 0.5rem",
            borderRadius: "var(--radius-full)"
          }}>
            {totalCount} Found
          </span>
        </div>

        <button
          onClick={onReset}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "var(--text-muted)",
            cursor: "pointer"
          }}
          onMouseOver={(e) => (e.target.style.color = "var(--primary)")}
          onMouseOut={(e) => (e.target.style.color = "var(--text-muted)")}
        >
          <RotateCcw size={13} />
          <span>Reset All</span>
        </button>
      </div>

      {/* Prominent Search Restaurant Input Bar */}
      <div style={{ marginBottom: "1rem", position: "relative" }}>
        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.35rem", display: "block" }}>
          SEARCH RESTAURANT
        </label>
        <SearchAutocomplete
          placeholder="Search by restaurant name, city, or cuisine (e.g., Anjappar, Annapoorna, Amma Mess)..."
          onSelect={(sug) => {
            onChange("search", sug.name);
          }}
          onSearch={(q) => {
            onChange("search", q);
          }}
        />
      </div>

      {/* Filter Controls Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "1rem",
        alignItems: "center"
      }}>
        {/* City Filter */}
        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.3rem", display: "block" }}>
            CITY
          </label>
          <select
            value={filters.city || "All"}
            onChange={(e) => onChange("city", e.target.value === "All" ? "" : e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.85rem",
              fontWeight: 600,
              backgroundColor: "var(--bg-main)",
              color: "var(--text-main)",
              border: "1px solid var(--border)"
            }}
          >
            <option value="All">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Cuisine Filter */}
        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.3rem", display: "block" }}>
            CUISINE
          </label>
          <select
            value={filters.cuisine || "All"}
            onChange={(e) => onChange("cuisine", e.target.value === "All" ? "" : e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.85rem",
              fontWeight: 600,
              backgroundColor: "var(--bg-main)",
              color: "var(--text-main)",
              border: "1px solid var(--border)"
            }}
          >
            <option value="All">All Cuisines</option>
            {cuisines.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Minimum Rating */}
        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.3rem", display: "block" }}>
            RATING
          </label>
          <select
            value={filters.min_rating || ""}
            onChange={(e) => onChange("min_rating", e.target.value ? parseFloat(e.target.value) : "")}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.85rem",
              fontWeight: 600,
              backgroundColor: "var(--bg-main)",
              color: "var(--text-main)",
              border: "1px solid var(--border)"
            }}
          >
            {RATING_OPTIONS.map((r) => (
              <option key={r.label} value={r.val}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.3rem", display: "block" }}>
            SORT BY
          </label>
          <select
            value={filters.sort_by || "rating"}
            onChange={(e) => onChange("sort_by", e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.85rem",
              fontWeight: 600,
              backgroundColor: "var(--bg-main)",
              color: "var(--text-main)",
              border: "1px solid var(--border)"
            }}
          >
            <option value="rating">Top Rated</option>
            <option value="distance">Nearest Distance</option>
            <option value="wait_time">Shortest Wait Time</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Toggles for Real-time Availability */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.75rem",
        marginTop: "1rem",
        paddingTop: "0.85rem",
        borderTop: "1px dashed var(--border)"
      }}>
        {/* Open Now */}
        <label style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          cursor: "pointer",
          fontSize: "0.82rem",
          fontWeight: 600,
          backgroundColor: filters.open_now ? "var(--primary-light)" : "var(--bg-main)",
          color: filters.open_now ? "var(--primary)" : "var(--text-main)",
          padding: "0.35rem 0.75rem",
          borderRadius: "var(--radius-full)",
          border: "1px solid",
          borderColor: filters.open_now ? "var(--primary)" : "var(--border)"
        }}>
          <input
            type="checkbox"
            checked={!!filters.open_now}
            onChange={(e) => onChange("open_now", e.target.checked ? true : "")}
            style={{ display: "none" }}
          />
          <span className="pulse-dot pulse-green" />
          <span>Open Now</span>
        </label>

        {/* Table Available */}
        <label style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          cursor: "pointer",
          fontSize: "0.82rem",
          fontWeight: 600,
          backgroundColor: filters.table_status === "AVAILABLE" ? "var(--secondary-light)" : "var(--bg-main)",
          color: filters.table_status === "AVAILABLE" ? "var(--secondary)" : "var(--text-main)",
          padding: "0.35rem 0.75rem",
          borderRadius: "var(--radius-full)",
          border: "1px solid",
          borderColor: filters.table_status === "AVAILABLE" ? "var(--secondary)" : "var(--border)"
        }}>
          <input
            type="checkbox"
            checked={filters.table_status === "AVAILABLE"}
            onChange={(e) => onChange("table_status", e.target.checked ? "AVAILABLE" : "")}
            style={{ display: "none" }}
          />
          <span>Tables Ready (Zero Wait)</span>
        </label>

        {/* Parking Available */}
        <label style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          cursor: "pointer",
          fontSize: "0.82rem",
          fontWeight: 600,
          backgroundColor: filters.parking_status === "AVAILABLE" ? "var(--secondary-light)" : "var(--bg-main)",
          color: filters.parking_status === "AVAILABLE" ? "var(--secondary)" : "var(--text-main)",
          padding: "0.35rem 0.75rem",
          borderRadius: "var(--radius-full)",
          border: "1px solid",
          borderColor: filters.parking_status === "AVAILABLE" ? "var(--secondary)" : "var(--border)"
        }}>
          <input
            type="checkbox"
            checked={filters.parking_status === "AVAILABLE"}
            onChange={(e) => onChange("parking_status", e.target.checked ? "AVAILABLE" : "")}
            style={{ display: "none" }}
          />
          <span>Guaranteed Parking</span>
        </label>
      </div>
    </div>
  );
}