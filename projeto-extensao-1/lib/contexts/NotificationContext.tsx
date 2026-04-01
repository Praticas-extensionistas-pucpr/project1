"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useBarberAuth } from "./BarberAuthContext";

interface NotificationContextType {
  newAppointmentsCount: number;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  newAppointmentsCount: 0,
  clearNotifications: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { token, logout } = useBarberAuth();
  const [newCount, setNewCount] = useState(0);

  const poll = useCallback(async () => {
    if (!token) return;
    try {
      const lastVisit =
        localStorage.getItem("appointmentsLastVisit") ??
        new Date(0).toISOString();
      const res = await fetch(
        `/api/barber/appointments?createdAfter=${encodeURIComponent(lastVisit)}&limit=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 401) {
        logout();
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setNewCount(data.pagination.total);
    } catch {
      // silencia erros de rede no polling
    }
  }, [token, logout]);

  useEffect(() => {
    if (!token) return;
    poll();
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [poll, token]);

  const clearNotifications = useCallback(() => {
    localStorage.setItem("appointmentsLastVisit", new Date().toISOString());
    setNewCount(0);
  }, []);

  return (
    <NotificationContext.Provider value={{ newAppointmentsCount: newCount, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  return useContext(NotificationContext);
}
