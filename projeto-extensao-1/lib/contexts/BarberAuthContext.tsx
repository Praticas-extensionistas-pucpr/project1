"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export interface BarberData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  bio?: string;
  avatarUrl?: string;
}

interface BarberAuthContextType {
  barber: BarberData | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshBarber: (updated: BarberData) => void;
}

const BarberAuthContext = createContext<BarberAuthContextType | null>(null);

/** Decodifica o payload do JWT (sem verificar assinatura) e checa se expirou. */
function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return typeof payload.exp === "number" && payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function BarberAuthProvider({ children }: { children: React.ReactNode }) {
  const [barber, setBarber] = useState<BarberData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restaura sessão do localStorage ao montar e mantém cookie em sync para o middleware
  useEffect(() => {
    const storedToken = localStorage.getItem("barber_token");
    const storedBarber = localStorage.getItem("barber_data");
    if (storedToken && storedBarber) {
      if (isTokenExpired(storedToken)) {
        // Token expirado — limpa tudo para forçar novo login
        localStorage.removeItem("barber_token");
        localStorage.removeItem("barber_data");
        Cookies.remove("barber-token");
      } else {
        try {
          setToken(storedToken);
          setBarber(JSON.parse(storedBarber));
          Cookies.set("barber-token", storedToken, { expires: 7 });
        } catch {
          localStorage.removeItem("barber_token");
          localStorage.removeItem("barber_data");
          Cookies.remove("barber-token");
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao fazer login.");
      localStorage.setItem("barber_token", data.token);
      localStorage.setItem("barber_data", JSON.stringify(data.barber));
      Cookies.set("barber-token", data.token, { expires: 7 });
      setToken(data.token);
      setBarber(data.barber);
      router.push("/barber/dashboard");
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("barber_token");
    localStorage.removeItem("barber_data");
    Cookies.remove("barber-token");
    setToken(null);
    setBarber(null);
    router.push("/barber/login");
  }, [router]);

  const refreshBarber = useCallback((updated: BarberData) => {
    localStorage.setItem("barber_data", JSON.stringify(updated));
    setBarber(updated);
  }, []);

  return (
    <BarberAuthContext.Provider
      value={{ barber, token, isLoading, login, logout, refreshBarber }}
    >
      {children}
    </BarberAuthContext.Provider>
  );
}

export function useBarberAuth(): BarberAuthContextType {
  const ctx = useContext(BarberAuthContext);
  if (!ctx)
    throw new Error("useBarberAuth deve ser usado dentro de BarberAuthProvider");
  return ctx;
}
