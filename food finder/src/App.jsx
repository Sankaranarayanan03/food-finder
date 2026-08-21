import { useState, useEffect, useCallback } from "react";
import { AuthProvider } from "./context/AuthContext";
import { RealtimeProvider } from "./context/RealtimeContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { SearchPage } from "./pages/SearchPage";
import { RestaurantDetailPage } from "./pages/RestaurantDetailPage";
import { ProfilePage } from "./pages/ProfilePage";
import { OwnerDashboardPage } from "./pages/OwnerDashboardPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { LoginPage } from "./pages/LoginPage";

// Modals & Widgets
import { BookingModal } from "./components/BookingModal";
import { AIRecommenderModal } from "./components/AIRecommenderModal";
import { CheckInModal } from "./components/CheckInModal";
import { ReviewModal } from "./components/ReviewModal";
import { ComplaintModal } from "./components/ComplaintModal";
import { WaitlistModal } from "./components/WaitlistModal";
import { AIChatWidget } from "./components/AIChatWidget";

import { api } from "./services/api";
import { useAuth } from "./context/AuthContext";
import { useRecentlyViewed } from "./hooks/useRecentlyViewed";

function AppContent() {
  const { registerRoleSwitchHandler } = useAuth();
  const { recentlyViewed, addToRecents } = useRecentlyViewed();
  
  const [currentView, setCurrentView] = useState("login");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [cities, setCities] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [searchParams, setSearchParams] = useState({});

  // Modals state
  const [activeBookingRest, setActiveBookingRest] = useState(null);
  const [activeBookingPreOrders, setActiveBookingPreOrders] = useState([]);
  const [activeWaitlistRest, setActiveWaitlistRest] = useState(null);
  const [activeComplaintRest, setActiveComplaintRest] = useState(null);
  const [activeReviewBooking, setActiveReviewBooking] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState("");
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  // Centralized Navigation helper that pushes history state for Browser Back/Forward buttons
  const navigateTo = useCallback((view, extraState = {}, replace = false) => {
    setCurrentView(view);
    if (extraState.restaurantId) {
      setSelectedRestaurantId(extraState.restaurantId);
    }
    if (extraState.searchParams) {
      setSearchParams(extraState.searchParams);
    }

    const state = { view, ...extraState };
    const hash = extraState.restaurantId ? `#${view}?id=${extraState.restaurantId}` : `#${view}`;
    
    if (replace) {
      window.history.replaceState(state, "", hash);
    } else {
      window.history.pushState(state, "", hash);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Listen to Browser Back / Forward buttons (popstate event)
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
        if (event.state.restaurantId) {
          setSelectedRestaurantId(event.state.restaurantId);
        }
        if (event.state.searchParams) {
          setSearchParams(event.state.searchParams);
        }
      } else {
        // Handle hash fallbacks or default view
        const hash = window.location.hash.replace("#", "").split("?")[0];
        if (["home", "search", "detail", "profile", "owner", "admin", "login"].includes(hash)) {
          setCurrentView(hash);
        } else {
          setCurrentView("login");
        }
      }
    };

    // Set initial state for root URL if no state exists
    if (!window.history.state) {
      window.history.replaceState({ view: "login" }, "", "#login");
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [cList, cuList] = await Promise.all([api.getCities(), api.getCuisines()]);
        setCities(cList);
        setCuisines(cuList);
      } catch (err) {
        console.error("Meta load error", err);
      }
    }
    loadMeta();
  }, []);

  const handleSearchTrigger = (params) => {
    setSearchParams(params);
    if (params.city) setSelectedCity(params.city);
    navigateTo("search", { searchParams: params });
  };

  const handleSelectRestaurant = (rest) => {
    setSelectedRestaurantId(rest.id);
    addToRecents(rest);
    navigateTo("detail", { restaurantId: rest.id });
  };

  const handleOpenAI = (prompt = "") => {
    setAiInitialPrompt(prompt);
    setShowAIModal(true);
  };

  // Auto-navigate when user switches demo roles
  const handleRoleSwitch = useCallback((role) => {
    let targetView = "home";
    if (role === "ADMIN") {
      targetView = "admin";
    } else if (role === "RESTAURANT_OWNER") {
      targetView = "owner";
    }
    navigateTo(targetView);
  }, [navigateTo]);

  // Register the handler once on mount
  useEffect(() => {
    registerRoleSwitchHandler(handleRoleSwitch);
  }, [registerRoleSwitchHandler, handleRoleSwitch]);

  return (
    <div className="app-container">
      {/* Top Navigation (Hidden on Login Page) */}
      {currentView !== "login" && (
        <Navbar
          onNavigate={(view) => navigateTo(view)}
          currentView={currentView}
          selectedCity={selectedCity}
          onSelectCity={(city) => {
            setSelectedCity(city);
            handleSearchTrigger({ city: city === "All Cities" ? "" : city });
          }}
          onOpenAI={() => handleOpenAI()}
        />
      )}

      {/* Main Routed Page Content */}
      <main className="main-content">
        {currentView === "home" && (
          <HomePage
            onSearch={handleSearchTrigger}
            onSelectRestaurant={handleSelectRestaurant}
            onBookRestaurant={(r) => setActiveBookingRest(r)}
            onDirections={handleSelectRestaurant}
            onOpenAI={handleOpenAI}
            cities={cities}
            cuisines={cuisines}
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
            recentlyViewed={recentlyViewed}
          />
        )}

        {currentView === "search" && (
          <SearchPage
            initialParams={searchParams}
            onSelectRestaurant={handleSelectRestaurant}
            onBookRestaurant={(r) => setActiveBookingRest(r)}
            onDirections={handleSelectRestaurant}
            onOpenAI={handleOpenAI}
            cities={cities}
            cuisines={cuisines}
          />
        )}

        {currentView === "detail" && selectedRestaurantId && (
          <RestaurantDetailPage
            restaurantId={selectedRestaurantId}
            onBack={() => window.history.back()}
            onBook={(r, preOrders = []) => {
              setActiveBookingRest(r);
              setActiveBookingPreOrders(preOrders);
            }}
            onOpenWaitlist={(r) => setActiveWaitlistRest(r)}
            onOpenFileComplaint={(r) => setActiveComplaintRest(r)}
            onWriteReview={(booking, rest) => setActiveReviewBooking({ booking, rest })}
          />
        )}

        {currentView === "profile" && (
          <ProfilePage
            onSelectRestaurant={handleSelectRestaurant}
            onBookRestaurant={(r) => {
              setActiveBookingRest(r);
              setActiveBookingPreOrders([]);
            }}
            onWriteReview={(booking, rest) => setActiveReviewBooking({ booking, rest })}
            recentlyViewed={recentlyViewed}
          />
        )}

        {currentView === "owner" && <OwnerDashboardPage />}

        {currentView === "admin" && <AdminDashboardPage />}

        {currentView === "login" && (
          <LoginPage
            onNavigate={(view) => navigateTo(view)}
            onLoginSuccess={(role) => {
              if (role === "ADMIN") {
                navigateTo("admin");
              } else if (role === "RESTAURANT_OWNER") {
                navigateTo("owner");
              } else {
                navigateTo("home");
              }
            }}
          />
        )}
      </main>

      {/* Footer (Hidden on Login Page) */}
      {currentView !== "login" && (
        <Footer
          onSelectCity={(city) => {
            setSelectedCity(city);
            handleSearchTrigger({ city });
          }}
          onSelectCuisine={(cuisine) => {
            handleSearchTrigger({ cuisine });
          }}
        />
      )}

      {/* Modals Container */}
      {activeBookingRest && (
        <BookingModal
          restaurant={activeBookingRest}
          preOrders={activeBookingPreOrders}
          onClose={() => {
            setActiveBookingRest(null);
            setActiveBookingPreOrders([]);
          }}
          onBookingSuccess={() => {}}
        />
      )}

      {showAIModal && (
        <AIRecommenderModal
          initialQuery={aiInitialPrompt}
          onClose={() => setShowAIModal(false)}
          onSelectRestaurant={(r) => handleSelectRestaurant(r)}
          onBookRestaurant={(r) => setActiveBookingRest(r)}
        />
      )}

      {showCheckInModal && (
        <CheckInModal
          onClose={() => setShowCheckInModal(false)}
          onCheckInSuccess={() => {}}
        />
      )}

      {activeWaitlistRest && (
        <WaitlistModal
          restaurant={activeWaitlistRest}
          onClose={() => setActiveWaitlistRest(null)}
        />
      )}

      {activeComplaintRest && (
        <ComplaintModal
          restaurant={activeComplaintRest}
          onClose={() => setActiveComplaintRest(null)}
        />
      )}

      {activeReviewBooking && (
        <ReviewModal
          booking={activeReviewBooking.booking}
          restaurant={activeReviewBooking.rest}
          onClose={() => setActiveReviewBooking(null)}
          onReviewSubmitted={() => {
            if (currentView === "detail") {
              // Reload details
            }
          }}
        />
      )}

      {/* Persistent Floating AI Chat Assistant Widget (Hidden on Login Page) */}
      {currentView !== "login" && (
        <AIChatWidget
          onSelectRestaurant={handleSelectRestaurant}
          onBookRestaurant={(r) => setActiveBookingRest(r)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RealtimeProvider>
          <AppContent />
        </RealtimeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
