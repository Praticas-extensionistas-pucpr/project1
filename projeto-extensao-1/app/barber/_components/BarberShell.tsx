"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBarberAuth } from "@/lib/contexts/BarberAuthContext";
import Sidebar from "@/app/barber/_components/Sidebar";

export default function BarberShell({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useBarberAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/barber/login");
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
