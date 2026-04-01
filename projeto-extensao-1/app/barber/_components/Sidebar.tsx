"use client";

import Link from "next/link";
import Image from "next/image";
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
    href: "/barber/clientes",
    label: "Clientes",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
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
    href: "/barber/estoque",
    label: "Estoque",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
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
    <aside className="flex flex-col w-64 h-full min-h-screen bg-white border-r border-[#e8e8e8]">

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#e8e8e8]">
        <Image
          src="/logo-pole.jfif"
          alt="Oreia Cuts"
          width={36}
          height={36}
          className="rounded-lg"
        />
        <div>
          <p className="text-[#0a0a0a] text-xs font-bold uppercase tracking-[0.2em] leading-none">
            Oreia Cuts
          </p>
          <p className="text-[#888888] text-xs mt-1 uppercase tracking-[0.1em]">Painel</p>
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
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-colors duration-200 ${
                isActive
                  ? "bg-[#cc0000] text-white"
                  : "text-[#888888] hover:bg-[#f5f5f5] hover:text-[#0a0a0a]"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="px-3 py-4 border-t border-[#e8e8e8]">
        {/* Avatar + nome */}
        <div className="flex items-center gap-3 px-3 py-3 mb-1 bg-[#f5f5f5] rounded-lg">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#0a0a0a] text-white text-sm font-bold shrink-0">
            {barber?.name?.charAt(0).toUpperCase() ?? "B"}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-[#0a0a0a] text-sm font-semibold truncate">{barber?.name}</p>
            <p className="text-[#888888] text-xs truncate">{barber?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-[#888888] hover:bg-[#f5f5f5] hover:text-[#cc0000] transition-colors duration-200"
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
