import { useState, useCallback } from "react";

const STORAGE_KEY = "srf_recently_viewed";
const MAX_ITEMS = 8;

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addToRecents = useCallback((restaurant) => {
    if (!restaurant?.id) return;
    setRecentlyViewed((prev) => {
      // Remove if already present, then prepend
      const filtered = prev.filter((r) => r.id !== restaurant.id);
      const next = [
        {
          id: restaurant.id,
          name: restaurant.name,
          city: restaurant.city,
          cuisine: restaurant.cuisine,
          rating: restaurant.rating,
          image_url: restaurant.image_url,
          price_range: restaurant.price_range,
          avg_cost_for_two: restaurant.avg_cost_for_two,
          is_open: restaurant.is_open,
          table_status: restaurant.table_status,
          viewedAt: Date.now(),
        },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
    // ignored
  }
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecentlyViewed([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
    // ignored
  }
  }, []);

  return { recentlyViewed, addToRecents, clearRecents };
}