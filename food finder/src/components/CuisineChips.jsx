const CUISINE_CHIPS = [
  { label: "Chettinad", emoji: "🌶️", query: "Chettinad", color: "#FF541E", bg: "rgba(255, 84, 30, 0.12)" },
  { label: "Biryani", emoji: "🍛", query: "Biryani", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)" },
  { label: "Dosa", emoji: "🥞", query: "Dosa", color: "#EAB308", bg: "rgba(234, 179, 8, 0.12)" },
  { label: "Parotta", emoji: "🫓", query: "Parotta", color: "#D97706", bg: "rgba(217, 119, 6, 0.12)" },
  { label: "Seafood", emoji: "🦐", query: "Seafood", color: "#06B6D4", bg: "rgba(6, 182, 212, 0.12)" },
  { label: "Meals", emoji: "🍽️", query: "Traditional Meals", color: "#10B981", bg: "rgba(16, 185, 129, 0.12)" },
  { label: "Idli", emoji: "🫙", query: "Idli", color: "#6366F1", bg: "rgba(99, 102, 241, 0.12)" },
  { label: "Kongunadu", emoji: "🫕", query: "Kongunadu", color: "#84CC16", bg: "rgba(132, 204, 22, 0.12)" },
  { label: "Street Food", emoji: "🌮", query: "Street Food", color: "#EC4899", bg: "rgba(236, 72, 153, 0.12)" },
  { label: "Vegetarian", emoji: "🥗", query: "Vegetarian", color: "#22C55E", bg: "rgba(34, 197, 94, 0.12)" },
  { label: "South Indian", emoji: "🍲", query: "South Indian", color: "#F97316", bg: "rgba(249, 115, 22, 0.12)" },
  { label: "Multicuisine", emoji: "🍴", query: "Multicuisine", color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.12)" },
];

export function CuisineChips({ onSelectCuisine, activeCuisine = "" }) {
  return (
    <div
      style={{
        overflowX: "auto",
        paddingBottom: "0.5rem",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "0.65rem",
          width: "max-content",
          padding: "0.25rem 0",
        }}
      >
        {CUISINE_CHIPS.map((chip) => {
          const isActive = activeCuisine?.toLowerCase() === chip.query.toLowerCase();
          return (
            <button
              key={chip.query}
              onClick={() => onSelectCuisine(isActive ? "" : chip.query)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.75rem 1.1rem",
                borderRadius: "var(--radius-xl)",
                border: "2px solid",
                borderColor: isActive ? chip.color : "var(--border)",
                backgroundColor: isActive ? chip.bg : "var(--bg-card)",
                color: isActive ? chip.color : "var(--text-main)",
                fontWeight: 800,
                fontSize: "0.82rem",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                whiteSpace: "nowrap",
                transform: isActive ? "translateY(-3px) scale(1.04)" : "translateY(0) scale(1)",
                boxShadow: isActive ? `0 6px 18px ${chip.color}35` : "var(--shadow-sm)",
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = chip.color;
                  e.currentTarget.style.backgroundColor = chip.bg;
                  e.currentTarget.style.color = chip.color;
                  e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
                  e.currentTarget.style.boxShadow = `0 6px 16px ${chip.color}25`;
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.backgroundColor = "var(--bg-card)";
                  e.currentTarget.style.color = "var(--text-main)";
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }
              }}
            >
              <span style={{ fontSize: "1.6rem", lineHeight: 1, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}>
                {chip.emoji}
              </span>
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
