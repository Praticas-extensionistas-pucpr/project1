"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useBarberAuth } from "@/lib/contexts/BarberAuthContext";
import { useNotifications } from "@/lib/contexts/NotificationContext";

const navItems = [
  {
    href: "/barber/dashboard",
    label: "Painel",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/barber/appointments",
    label: "Agendamentos",
    badge: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/barber/caixa",
    label: "Caixa",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: "/barber/clientes",
    label: "Clientes",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/barber/services",
    label: "Serviços",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: "/barber/estoque",
    label: "Estoque",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
      </svg>
    ),
  },
  {
    href: "/barber/profile",
    label: "Meu Perfil",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { barber, logout } = useBarberAuth();
  const { newAppointmentsCount } = useNotifications();

  return (
    <aside className="flex flex-col w-64 h-full min-h-screen bg-white border-r border-[#e8e8e8]">

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#e8e8e8]">
        <Image src="/logo-pole.jfif" alt="Oreia Cuts" width={36} height={36} className="rounded-lg" />
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
          const showBadge = item.badge && newAppointmentsCount > 0;
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
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1 bg-[#cc0000] text-white text-xs font-bold rounded-full leading-none">
                  {newAppointmentsCount > 99 ? "99+" : newAppointmentsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé: Configurações + User + Logout */}
      <div className="px-3 py-4 border-t border-[#e8e8e8] space-y-1">
        {/* Configurações */}
        <Link
          href="/barber/configuracoes"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-colors duration-200 ${
            pathname === "/barber/configuracoes"
              ? "bg-[#cc0000] text-white"
              : "text-[#888888] hover:bg-[#f5f5f5] hover:text-[#0a0a0a]"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configurações
        </Link>

        {/* Avatar + nome */}
        <div className="flex items-center gap-3 px-3 py-3 bg-[#f5f5f5] rounded-lg">
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sair
        </button>
      </div>
    </aside>
  );
}
