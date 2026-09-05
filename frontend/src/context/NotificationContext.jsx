import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "./AuthContext.jsx";

const NotificationContext = createContext(null);
const POLL_INTERVAL_MS = 20000; // 20s — simple polling, no websockets needed for this scope

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchRecent = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await axiosClient.get("/notifications", { params: { limit: 5, page: 1 } });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent fail — polling, don't spam error UI for a background refresh
    }
  }, [user]);

  const markAsRead = async (id) => {
    await axiosClient.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await axiosClient.patch("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    fetchRecent();
    intervalRef.current = setInterval(fetchRecent, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [user, fetchRecent]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, refresh: fetchRecent }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}