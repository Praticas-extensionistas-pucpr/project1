"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBarberAuth } from "@/lib/contexts/BarberAuthContext";

const navItems = [
  {
    href: "/barber/dashboard",
    label: "Painel",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/barber/appointments",
    label: "Agendamentos",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/barber/services",
    label: "Serviços",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: "/barber/profile",
    label: "Meu Perfil",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { barber, logout } = useBarberAuth();

  return (
    <aside className="flex flex-col w-64 h-full min-h-screen bg-zinc-900 border-r border-zinc-800">
      {/* Logo/Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-zinc-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-400">
          <svg className="w-5 h-5 text-zinc-900" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 2v2H5v2H3V2h4zm14 0v4h-2V4h-2V2h4zM3 20v-4h2v2h2v2H3zm16 0h-2v-2h2v-2h2v4h-2zM7 6v2H5v2H3V6h4zm4 0h2v2h2v2h-2v2h-2V6zm4 0h2v4h-2V6zM7 14v2H5v2H3v-4h4zm10 0h2v4h-4v-2h2v-2zm-6 0h2v4h-2v-4zm-2-4h2v2H9v-2z"/>
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-none">Barbearia</p>
          <p className="text-zinc-400 text-xs mt-0.5">Painel do Barbeiro</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-amber-400 text-zinc-900"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="px-3 py-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-700 text-white text-sm font-semibold shrink-0">
            {barber?.name?.charAt(0).toUpperCase() ?? "B"}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-medium truncate">{barber?.name}</p>
            <p className="text-zinc-500 text-xs truncate">{barber?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sair
        </button>
      </div>
    </aside>
  );
}
