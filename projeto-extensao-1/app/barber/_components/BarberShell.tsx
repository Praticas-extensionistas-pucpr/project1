"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBarberAuth } from "@/lib/contexts/BarberAuthContext";
import Sidebar from "@/app/barber/_components/Sidebar";

export default function BarberShell({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useBarberAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/barber/login");
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#e8e8e8] border-t-[#cc0000] rounded-full animate-spin" />
          <p className="text-[#888888] text-sm font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      {/* Overlay backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transition-transform duration-200 md:relative md:translate-x-0 md:flex md:shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#e8e8e8] shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-[#888888] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors"
            aria-label="Abrir menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <img src="/logo-pole.jfif" alt="Oreia Cuts" width={28} height={28} className="rounded-md" />
            <p className="text-[#0a0a0a] text-xs font-bold uppercase tracking-[0.2em]">Oreia Cuts</p>
          </div>

          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
