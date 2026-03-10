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
      {/* Overlay backdrop (mobile only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — drawer on mobile, static on desktop */}
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
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Abrir menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-400">
              <svg className="w-4 h-4 text-zinc-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 2v2H5v2H3V2h4zm14 0v4h-2V4h-2V2h4zM3 20v-4h2v2h2v2H3zm16 0h-2v-2h2v-2h2v4h-2zM7 6v2H5v2H3V6h4zm4 0h2v2h2v2h-2v2h-2V6zm4 0h2v4h-2V6zM7 14v2H5v2H3v-4h4zm10 0h2v4h-4v-2h2v-2zm-6 0h2v4h-2v-4zm-2-4h2v2H9v-2z" />
              </svg>
            </div>
            <p className="text-white font-semibold text-sm">Barbearia</p>
          </div>

          {/* Spacer to center title */}
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
