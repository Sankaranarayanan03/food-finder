/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";

const RealtimeContext = createContext(null);
const REALTIME_WS_URL = import.meta.env.VITE_REALTIME_WS_URL;

export function RealtimeProvider({ children }) {
  const [liveUpdates, setLiveUpdates] = useState({});
  const [notification, setNotification] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    function connect() {
      if (!REALTIME_WS_URL) return;

      try {
        ws = new WebSocket(REALTIME_WS_URL);

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "AVAILABILITY_UPDATE") {
              setLiveUpdates((prev) => ({
                ...prev,
                [data.restaurant_id]: data,
              }));
              // Show notification pill
              setNotification({
                title: "Live Status Update",
                message: `Restaurant availability updated in real-time.`,
                timestamp: Date.now(),
              });
              setTimeout(() => setNotification(null), 4000);
            }
          } catch (err) {
            console.error("WS parse error", err);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.warn("WebSocket connection error:", err);
      }
    }

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ liveUpdates, notification, wsConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}