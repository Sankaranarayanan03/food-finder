import { useState, useEffect, useRef } from "react";
import { Search, X, MapPin, Star, Utensils } from "lucide-react";
import { api } from "../services/api";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function SearchAutocomplete({ onSelect, onSearch, placeholder = "Search restaurant, cuisine, or city..." }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debouncedQuery = useDebounce(query, 280);

  useEffect(() => {
    let ignore = false;
    if (debouncedQuery.trim().length < 2) {
      Promise.resolve().then(() => {
        if (!ignore) {
          setSuggestions([]);
          setOpen(false);
        }
      });
      return () => { ignore = true; };
    }
    Promise.resolve().then(() => {
      if (!ignore) setLoading(true);
    });
    api.autocomplete(debouncedQuery)
      .then((data) => {
        if (!ignore) {
          setSuggestions(data || []);
          setOpen(true);
        }
      })
      .catch(() => { if (!ignore) setSuggestions([]); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleKeyDown = (e) => {
    if (!open || !suggestions.length) {
      if (e.key === "Enter") {
        onSearch(query);
        setOpen(false);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIdx >= 0 && suggestions[focusedIdx]) {
        handleSelect(suggestions[focusedIdx]);
      } else {
        onSearch(query);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setFocusedIdx(-1);
    }
  };

  const handleSelect = (suggestion) => {
    setQuery(suggestion.name);
    setOpen(false);
    setFocusedIdx(-1);
    onSelect(suggestion);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 1 }}>
      {/* Input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          backgroundColor: "var(--bg-card)",
          border: "2px solid",
          borderColor: open ? "var(--primary)" : "var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "0.6rem 0.9rem",
          transition: "border-color 0.2s ease",
          boxShadow: open ? "0 0 0 3px rgba(224,90,27,0.12)" : "none",
        }}
      >
        <Search size={18} style={{ color: open ? "var(--primary)" : "var(--text-muted)", flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setFocusedIdx(-1); }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "var(--text-main)",
            backgroundColor: "transparent",
          }}
        />
        {loading && (
          <div
            style={{
              width: "16px",
              height: "16px",
              border: "2px solid var(--border)",
              borderTopColor: "var(--primary)",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
              flexShrink: 0,
            }}
          />
        )}
        {query && !loading && (
          <button onClick={handleClear} style={{ color: "var(--text-muted)", padding: "0" }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            backgroundColor: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-xl)",
            zIndex: 1000,
            overflow: "hidden",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <div style={{ padding: "0.4rem 0.75rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-main)" }}>
            RESULTS FOR "{query}"
          </div>
          {suggestions.map((s, idx) => (
            <button
              key={s.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                textAlign: "left",
                backgroundColor: focusedIdx === idx ? "var(--primary-light)" : "var(--bg-card)",
                borderBottom: idx < suggestions.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background-color 0.1s",
              }}
              onMouseEnter={() => setFocusedIdx(idx)}
              onMouseLeave={() => setFocusedIdx(-1)}
            >
              {/* Icon */}
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  backgroundColor: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Utensils size={16} style={{ color: "var(--primary)" }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>
                  {s.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.15rem" }}>
                  <MapPin size={11} style={{ color: "var(--primary)" }} />
                  <span>{s.city} • {s.cuisine}</span>
                </div>
              </div>

              {/* Rating */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.2rem",
                  backgroundColor: "#FEF3C7",
                  color: "#92400E",
                  padding: "0.2rem 0.45rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                }}
              >
                <Star size={10} style={{ fill: "#F59E0B", color: "#F59E0B" }} />
                <span>{s.rating}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}