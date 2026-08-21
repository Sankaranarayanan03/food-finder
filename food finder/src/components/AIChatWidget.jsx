import { useState, useRef, useEffect } from "react";
import { 
  Sparkles, Send, Bot, Star, 
  Utensils, Minimize2, Store, Shield, Check, Navigation
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

let idCounter = 0;
function generateId() {
  idCounter += 1;
  return `${Date.now()}-${idCounter}-${Math.random().toString(36).substring(2, 7)}`;
}

export function AIChatWidget({ onSelectRestaurant, onBookRestaurant }) {
  const { user, isOwner, isAdmin } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [pendingMutation, setPendingMutation] = useState(null);

  // Role-based Configs (Matching Master Prompt Section 8 Exactly)
  const ROLE_CONFIG = {
    ADMIN: {
      title: "Admin AI Supervisor",
      badge: "Platform Governance",
      gradient: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)",
      icon: Shield,
      welcomeText: "🛡️ Greetings Administrator! I am your Platform Governance Supervisor. Ask me about system-wide booking volume, verification audit logs, or registered restaurant owners across Tamil Nadu.",
      quickPrompts: [
        "How many restaurants are registered?",
        "How many bookings were made today?",
        "Show verification audit statistics.",
        "Which Tamil Nadu city has the most restaurants?"
      ]
    },
    RESTAURANT_OWNER: {
      title: "Owner AI Assistant",
      badge: "Store Operations",
      gradient: "linear-gradient(135deg, #065F46 0%, #059669 100%)",
      icon: Store,
      welcomeText: "👨‍🍳 Vanakkam Owner! I am your live store AI copilot. Ask about tonight's expected guests, available tables, or update your live waiting time.",
      quickPrompts: [
        "How many bookings do I have today?",
        "How many tables are available at 8 PM?",
        "Set waiting time to 25 minutes",
        "Show today's check-ins summary"
      ]
    },
    CUSTOMER: {
      title: "Tamil Nadu Smart AI Food Finder",
      badge: "Live Recommender",
      gradient: "linear-gradient(135deg, #FF3B5C 0%, #FF541E 100%)",
      icon: Bot,
      welcomeText: "🙏 Vanakkam! I am your AI Food Navigator. Tell me what you're craving (e.g. 'Spicy Chettinad Biryani in Madurai under ₹600 with parking').",
      quickPrompts: [
        "Vegetarian food in Coimbatore under ₹500 with parking",
        "Spicy Biryani in Chennai near me",
        "Show restaurants with available tables at 8 PM",
        "Which restaurant has the shortest waiting time?"
      ]
    }
  };

  const userRoleKey = isAdmin ? "ADMIN" : (isOwner ? "RESTAURANT_OWNER" : "CUSTOMER");
  const config = ROLE_CONFIG[userRoleKey];

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: config.welcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Reset messages when role changes
  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        setMessages([
          {
            id: 1,
            sender: "bot",
            text: config.welcomeText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setPendingMutation(null);
      }
    });
    return () => { ignore = true; };
  }, [user?.role, config.welcomeText]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Execute confirmed mutation for Owner AI (Confirm-Then-Execute Flow)
  const handleConfirmMutation = async (action, params) => {
    setLoading(true);
    try {
      const res = await api.executeOwnerAIMutation(params.restaurant_id, action, params);
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          sender: "bot",
          text: res.message || "✓ Operation completed successfully.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          sender: "bot",
          text: `❌ Mutation failed: ${err.message || "Unauthorized action"}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputMessage;
    if (!query.trim()) return;

    const userMsgId = generateId();
    const userMsg = {
      id: userMsgId,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setLoading(true);

    const lowerQ = query.toLowerCase();

    // 1. ADMIN AI SUPERVISOR ROUTING
    if (isAdmin) {
      try {
        const res = await api.getAdminAI(query);
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            sender: "bot",
            text: res.answer,
            metrics: res.metrics,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            sender: "bot",
            text: "I don't have enough verified data to provide that information.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. OWNER AI ASSISTANT ROUTING
    if (isOwner) {
      try {
        const res = await api.getOwnerAI(query, user?.restaurant_id || null);
        
        let msgObj = {
          id: generateId(),
          sender: "bot",
          text: res.answer,
          requiresConfirmation: res.requires_confirmation,
          pendingAction: res.pending_action,
          pendingParams: res.pending_params,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        if (res.requires_confirmation) {
          setPendingMutation({ action: res.pending_action, params: res.pending_params });
        }

        setMessages((prev) => [...prev, msgObj]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            sender: "bot",
            text: `⚠️ ${err.message || "I don't have enough verified information to answer that. Try asking about today's bookings, table status, or waiting time."}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 3. CUSTOMER AI ROUTING
    // Check if query is about customer's own bookings or passcodes
    if (lowerQ.includes("my booking") || lowerQ.includes("my passcode") || lowerQ.includes("my check-in code") || lowerQ.includes("my code") || lowerQ.includes("booking status") || lowerQ.includes("upcoming booking")) {
      try {
        const myBookings = await api.getMyBookings();
        if (myBookings && myBookings.length > 0) {
          const bListStr = myBookings.slice(0, 3).map((b) => 
            `• **${b.restaurant_name || "Restaurant"}** (${b.booking_date} ${b.booking_time})\n  Passcode: \`${b.verification_code}\` | Status: ${b.status}`
          ).join("\n\n");

          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              sender: "bot",
              text: `📅 **Your Authenticated Upcoming Bookings:**\n\n${bListStr}\n\nShow your 6-digit passcode upon arrival for **+10 Loyalty Points**!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              sender: "bot",
              text: "You don't have any active bookings right now. Use the search bar above to discover top Tamil Nadu spots and reserve a table instantly!",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            sender: "bot",
            text: "Please sign in to view your personal booking passcodes and loyalty status.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Check if query is about loyalty points
    if (lowerQ.includes("loyalty") || lowerQ.includes("my points") || lowerQ.includes("reward points")) {
      try {
        const loyaltyData = await api.getLoyalty();
        const pts = loyaltyData.total_points || 0;
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            sender: "bot",
            text: `🏆 **Your Loyalty Balance:**\n\nYou currently have **${pts} Loyalty Points**! Earn +10 points for every verified table check-in across Tamil Nadu restaurants.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            sender: "bot",
            text: "Please sign in to view your accumulated loyalty points balance.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Check if query is about check-in process or 6-digit code
    if (lowerQ.includes("check-in process") || lowerQ.includes("how to check in") || lowerQ.includes("checkin process") || lowerQ.includes("6-digit code")) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          sender: "bot",
          text: "🔑 **Check-In Verification Guide:**\n\n1. Book a table at any restaurant.\n2. Receive a unique 6-digit verification code.\n3. Show code to restaurant staff upon arrival.\n4. Staff verifies code in Owner Terminal to confirm arrival and unlock **+10 Loyalty Points**!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setLoading(false);
      return;
    }

    // Check if query is about cancellation process
    if (lowerQ.includes("cancel") || lowerQ.includes("cancellation")) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          sender: "bot",
          text: "🚫 **Cancellation Policy & Process:**\n\nYou can cancel any upcoming reservation directly from your Profile page -> My Bookings section. Free cancellations are allowed up to your scheduled time slot, immediately releasing the table.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setLoading(false);
      return;
    }

    // Check if query is about verified reviews
    if (lowerQ.includes("verified review") || lowerQ.includes("how to review")) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          sender: "bot",
          text: "⭐ **100% Verified Reviews:**\n\nOnly diners with a confirmed and checked-in booking can leave a review. This ensures all ratings and reviews across SmartFinder are authentic!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setLoading(false);
      return;
    }

    // Default Customer Recommendation API call
    try {
      const res = await api.getAIRecommendations(query);

      let botResponseMsg = {
        id: generateId(),
        sender: "bot",
        text: res.recommendation_reason || "Here are the top restaurant matches based on your request:",
        recommendations: res.best_match ? [res.best_match, ...(res.alternatives || []).map(a => a.restaurant)] : [],
        intent: res.parsed_intent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botResponseMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          sender: "bot",
          text: "I don't have enough verified information to answer that. Try asking for specific dishes like 'Authentic Dosa in Chennai' or 'Biryani in Dindigul'.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const IconComponent = config.icon;

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 999 }}>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: config.gradient,
            color: "#FFFFFF",
            border: "none",
            borderRadius: "var(--radius-full)",
            padding: "0.85rem 1.35rem",
            fontSize: "0.95rem",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05) translateY(-2px)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1) translateY(0)")}
        >
          <div style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Sparkles size={18} />
            <span className="pulse-dot pulse-green" style={{ position: "absolute", top: "-2px", right: "-2px" }} />
          </div>
          <span>{config.title}</span>
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div style={{
          width: "400px",
          height: "560px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          border: "1.5px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "scaleUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
        }}>
          {/* Header */}
          <div style={{
            background: config.gradient,
            color: "#FFFFFF",
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <IconComponent size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: "1.05rem", fontWeight: 900, margin: 0, color: "#FFFFFF" }}>
                  {config.title}
                </h4>
                <div style={{ fontSize: "0.72rem", opacity: 0.9, fontWeight: 700 }}>
                  {config.badge} • Live Data Sync
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                color: "#FFFFFF",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <Minimize2 size={16} />
            </button>
          </div>

          {/* Quick Prompts Chips */}
          <div style={{
            padding: "0.65rem 0.85rem",
            backgroundColor: "var(--bg-main)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            gap: "0.4rem",
            overflowX: "auto",
            scrollbarWidth: "none"
          }}>
            {config.quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                style={{
                  whiteSpace: "nowrap",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-main)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-full)",
                  padding: "0.3rem 0.65rem",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div style={{
            flex: 1,
            padding: "1rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem"
          }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: m.sender === "user" ? "flex-end" : "flex-start",
                  gap: "0.5rem"
                }}
              >
                {m.sender === "bot" && (
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: "var(--primary-light)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <Bot size={16} />
                  </div>
                )}

                <div style={{
                  maxWidth: "85%",
                  backgroundColor: m.sender === "user" ? "var(--primary)" : "var(--bg-card)",
                  color: m.sender === "user" ? "#FFFFFF" : "var(--text-main)",
                  padding: "0.75rem 0.95rem",
                  borderRadius: m.sender === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  fontSize: "0.85rem",
                  lineHeight: 1.45,
                  boxShadow: "var(--shadow-sm)",
                  border: m.sender === "user" ? "none" : "1px solid var(--border)"
                }}>
                  <div style={{ whiteSpace: "pre-line" }}>{m.text}</div>

                  {/* Render Confirm-Then-Execute Mutation Buttons for Owner */}
                  {m.requiresConfirmation && m.pendingAction && (
                    <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleConfirmMutation(m.pendingAction, m.pendingParams)}
                        style={{
                          backgroundColor: "#10B981",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: "var(--radius-md)",
                          padding: "0.4rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem"
                        }}
                      >
                        <Check size={14} />
                        Confirm Action
                      </button>
                      <button
                        onClick={() => {
                          setPendingMutation(null);
                          setMessages((prev) => [
                            ...prev,
                            {
                              id: generateId(),
                              sender: "bot",
                              text: "Operation cancelled.",
                              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }
                          ]);
                        }}
                        style={{
                          backgroundColor: "var(--bg-main)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          padding: "0.4rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Render Customer Recommendation Cards inside chat */}
                  {m.recommendations && m.recommendations.length > 0 && (
                    <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {m.recommendations.slice(0, 3).map((r) => (
                        <div
                          key={r.id}
                          style={{
                            backgroundColor: "var(--bg-main)",
                            borderRadius: "var(--radius-md)",
                            padding: "0.65rem",
                            border: "1px solid var(--border)"
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--text-main)" }}>
                            {r.name}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", gap: "0.4rem", marginTop: "0.2rem" }}>
                            <span>📍 {r.city}</span>
                            <span>•</span>
                            <span>⭐ {r.rating}</span>
                            <span>•</span>
                            <span>₹{r.avg_cost_for_two} for 2</span>
                          </div>

                          {/* Action Buttons: View Restaurant, Book Table, Get Directions */}
                          <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                            <button
                              onClick={() => { setIsOpen(false); onSelectRestaurant?.(r); }}
                              style={{
                                backgroundColor: "var(--bg-card)",
                                color: "var(--text-main)",
                                border: "1px solid var(--border)",
                                borderRadius: "6px",
                                padding: "0.3rem 0.55rem",
                                fontSize: "0.7rem",
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem"
                              }}
                            >
                              <Utensils size={12} />
                              View Restaurant
                            </button>
                            <button
                              onClick={() => { setIsOpen(false); onBookRestaurant?.(r); }}
                              style={{
                                backgroundColor: "var(--primary)",
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: "6px",
                                padding: "0.3rem 0.55rem",
                                fontSize: "0.7rem",
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem"
                              }}
                            >
                              <Star size={12} />
                              Book Table
                            </button>
                            <button
                              onClick={() => { setIsOpen(false); onSelectRestaurant?.(r); }}
                              style={{
                                backgroundColor: "#06B6D4",
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: "6px",
                                padding: "0.3rem 0.55rem",
                                fontSize: "0.7rem",
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem"
                              }}
                            >
                              <Navigation size={12} />
                              Get Directions
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{
                    fontSize: "0.65rem",
                    opacity: 0.7,
                    marginTop: "0.3rem",
                    textAlign: "right"
                  }}>
                    {m.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: "flex-start", backgroundColor: "var(--bg-card)", padding: "0.6rem 1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Sparkles size={14} className="pulse-dot pulse-green" />
                <span>AI is querying live database metrics...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            style={{
              padding: "0.75rem",
              backgroundColor: "var(--bg-card)",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <input
              type="text"
              placeholder={`Ask ${config.title}...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              style={{
                flex: 1,
                padding: "0.6rem 0.85rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.85rem",
                border: "1.5px solid var(--border)",
                backgroundColor: "var(--bg-main)",
                color: "var(--text-main)",
                fontWeight: 600
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: config.gradient,
                color: "#FFFFFF",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                opacity: inputMessage.trim() ? 1 : 0.5
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
