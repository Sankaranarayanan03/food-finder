const API_BASE_URL = "http://127.0.0.1:8000/api";
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("srf_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    // Unauthorized: could clear token if expired
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || "An unexpected error occurred.";
    throw new Error(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
  }
  return data;
}

export const api = {
  // Auth
  login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  register: (userData) => request("/auth/register", { method: "POST", body: JSON.stringify(userData) }),
  getMe: () => request("/auth/me"),

  // Restaurants
  getRestaurants: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "" && val !== "all" && val !== "All") {
        query.append(key, val);
      }
    });
    const qs = query.toString();
    return request(`/restaurants${qs ? `?${qs}` : ""}`);
  },
  getCities: () => request("/restaurants/cities"),
  getCuisines: () => request("/restaurants/cuisines"),
  getRestaurantDetails: (id, coords) => {
    const qs = coords ? `?user_lat=${coords.lat}&user_lng=${coords.lng}` : "";
    return request(`/restaurants/${id}${qs}`);
  },
  updateRestaurantStatus: (id, statusData) =>
    request(`/restaurants/${id}/status`, { method: "PATCH", body: JSON.stringify(statusData) }),

  // Bookings
  createBooking: (bookingData) =>
    request("/bookings", { method: "POST", body: JSON.stringify(bookingData) }),
  getMyBookings: () => request("/bookings/my-bookings"),
  cancelBooking: (bookingId) => request(`/bookings/${bookingId}/cancel`, { method: "POST" }),

  // Check-In
  verifyCheckInCode: (code) =>
    request("/checkin/verify-code", { method: "POST", body: JSON.stringify({ verification_code: code }) }),

  // AI Recommendation
  getAIRecommendations: (query, userCoords) =>
    request("/recommendations", {
      method: "POST",
      body: JSON.stringify({
        query,
        user_lat: userCoords?.lat || 13.0827,
        user_lng: userCoords?.lng || 80.2707,
      }),
    }),

  // Reviews
  createVerifiedReview: (reviewData) =>
    request("/reviews", { method: "POST", body: JSON.stringify(reviewData) }),
  getRestaurantReviews: (restaurantId) => request(`/reviews/restaurant/${restaurantId}`),

  // Complaints
  fileComplaint: (complaintData) =>
    request("/complaints", { method: "POST", body: JSON.stringify(complaintData) }),
  getMyComplaints: () => request("/complaints/my-complaints"),
  updateComplaint: (id, data) =>
    request(`/complaints/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Waitlist
  joinWaitlist: (waitlistData) =>
    request("/waitlist", { method: "POST", body: JSON.stringify(waitlistData) }),
  getMyWaitlist: () => request("/waitlist/my-waitlist"),

  // Profile & Favorites
  getProfile: () => request("/profile/me"),
  toggleFavorite: (restaurantId) =>
    request(`/profile/favorites/toggle/${restaurantId}`, { method: "POST" }),

  // Owner Portal
  getOwnerRestaurants: () => request("/owner/restaurants"),
  getOwnerDashboard: (restaurantId) => request(`/owner/dashboard/${restaurantId}`),
  getTodayCheckIns: (restaurantId) => request(`/owner/today-checkins/${restaurantId}`),
  getRestaurantTables: (restaurantId) => request(`/owner/tables/${restaurantId}`),
  addRestaurantTable: (restaurantId, tableData) =>
    request(`/owner/tables/${restaurantId}`, { method: "POST", body: JSON.stringify(tableData) }),
  addMenuItem: (restaurantId, itemData) =>
    request(`/owner/menu/${restaurantId}`, { method: "POST", body: JSON.stringify(itemData) }),

  // Restaurants extras
  getTrending: () => request("/restaurants/trending"),
  autocomplete: (q) => request(`/restaurants/autocomplete?q=${encodeURIComponent(q)}`),

  // Admin Portal
  getAdminStats: () => request("/admin/stats"),
  getAdminUsers: () => request("/admin/users"),
  getAdminComplaints: () => request("/admin/complaints"),
  getAdminAI: (query) =>
    request("/admin/ai-query", { method: "POST", body: JSON.stringify({ query }) }),

  // Owner AI
  getOwnerAI: (query, restaurantId) =>
    request("/owner/ai-query", { method: "POST", body: JSON.stringify({ query, restaurant_id: restaurantId }) }),
  executeOwnerAIMutation: (restaurantId, action, params) =>
    request("/owner/ai-execute-mutation", {
      method: "POST",
      body: JSON.stringify({ restaurant_id: restaurantId, action, params })
    }),

  // Loyalty Dashboard
  getLoyalty: () => request("/profile/loyalty"),
};