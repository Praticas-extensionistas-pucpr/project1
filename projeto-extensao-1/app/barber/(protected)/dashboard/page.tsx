"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useBarberAuth } from "@/lib/contexts/BarberAuthContext";
import StatusBadge from "@/app/barber/_components/StatusBadge";

type EarningsPeriod = "today" | "week" | "month";

interface EarningsData {
  totalEarnings: number;
  totalCompleted: number;
  avgEarnings: number;
  byService: { name: string; count: number; total: number }[];
}

interface AppointmentService {
  name: string;
  durationMinutes: number;
  price: number;
}

interface Appointment {
  _id: string;
  clientName: string;
  clientPhone: string;
  serviceId: AppointmentService;
  date: string;
  timeSlot: string;
  endTime: string;
  status: string;
}

interface Stats {
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  total: number;
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a] shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#999999] text-sm">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { token, barber } = useBarberAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, confirmed: 0, completed: 0, cancelled: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Earnings state
  const [earningsPeriod, setEarningsPeriod] = useState<EarningsPeriod>("today");
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fetchEarnings = useCallback(async () => {
    if (!token) return;
    setEarningsLoading(true);
    try {
      const res = await fetch(`/api/barber/earnings?period=${earningsPeriod}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEarningsData(data);
    } catch {
      setEarningsData(null);
    } finally {
      setEarningsLoading(false);
    }
  }, [token, earningsPeriod]);

  const fetchTodayAppointments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/barber/appointments?date=${today}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const list: Appointment[] = data.data;
      setAppointments(list);
      setStats({
        pending: list.filter((a) => a.status === "pending").length,
        confirmed: list.filter((a) => a.status === "confirmed").length,
        completed: list.filter((a) => a.status === "completed").length,
        cancelled: list.filter((a) => a.status === "cancelled").length,
        total: list.length,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar agenda");
    } finally {
      setLoading(false);
    }
  }, [token, today]);

  useEffect(() => {
    fetchTodayAppointments();
  }, [fetchTodayAppointments]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const activeAppointments = appointments
    .filter((a) => a.status === "pending" || a.status === "confirmed")
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Olá, {barber?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-[#999999] mt-1 capitalize">{todayFormatted}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Aguardando"
          value={stats.pending}
          color="text-[#ffaa00]"
          icon={
            <svg className="w-5 h-5 text-[#ffaa00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Confirmados"
          value={stats.confirmed}
          color="text-[#0080ff]"
          icon={
            <svg className="w-5 h-5 text-[#0080ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Concluídos"
          value={stats.completed}
          color="text-[#00cc00]"
          icon={
            <svg className="w-5 h-5 text-[#00cc00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <StatCard
          label="Cancelados"
          value={stats.cancelled}
          color="text-[#ff4444]"
          icon={
            <svg className="w-5 h-5 text-[#ff4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
        />
      </div>

      {/* Agenda do dia */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <h2 className="font-semibold text-white">Agenda de Hoje</h2>
          <Link
            href="/barber/appointments"
            className="text-sm text-[#cc0000] hover:text-[#ff0000] font-medium"
          >
            Ver todos →
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-7 h-7 border-3 border-[#2a2a2a] border-t-[#cc0000] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-[#ff4444] text-sm">{error}</div>
        ) : activeAppointments.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="w-10 h-10 text-[#2a2a2a] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[#666666] text-sm">Nenhum agendamento ativo para hoje.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#1a1a1a]">
            {activeAppointments.map((appt) => (
              <li key={appt._id}>
                <Link
                  href={`/barber/appointments/${appt._id}`}
                  className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 hover:bg-[#0a0a0a] transition-colors"
                >
                  {/* Horário */}
                  <div className="text-center min-w-[52px]">
                    <p className="text-base font-bold text-white">{appt.timeSlot}</p>
                    <p className="text-xs text-[#666666]">{appt.endTime}</p>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-10 bg-[#2a2a2a]" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{appt.clientName}</p>
                    <p className="text-sm text-[#999999] truncate">
                      {appt.serviceId?.name} · {appt.serviceId?.durationMinutes} min · R$ {appt.serviceId?.price}
                    </p>
                  </div>

                  <StatusBadge status={appt.status} />

                  <svg className="w-4 h-4 text-[#2a2a2a] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Controle de Ganhos */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] shadow-sm mt-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <h2 className="font-semibold text-white">Controle de Ganhos</h2>
          {/* Period tabs */}
          <div className="flex gap-1 bg-[#0a0a0a] rounded-lg p-1">
            {(["today", "week", "month"] as EarningsPeriod[]).map((p) => {
              const labels: Record<EarningsPeriod, string> = { today: "Hoje", week: "Semana", month: "Mês" };
              return (
                <button
                  key={p}
                  onClick={() => setEarningsPeriod(p)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    earningsPeriod === p
                      ? "bg-[#2a2a2a] text-[#cc0000] shadow-sm"
                      : "text-[#666666] hover:text-white"
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>
        </div>

        {earningsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-7 h-7 border-[3px] border-[#2a2a2a] border-t-[#cc0000] rounded-full animate-spin" />
          </div>
        ) : !earningsData ? (
          <div className="p-6 text-center text-[#ff4444] text-sm">Erro ao carregar ganhos.</div>
        ) : (
          <div className="p-6">
            {/* Main metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[#2a0000] rounded-xl p-4 text-center border border-[#4d0000]">
                <p className="text-xs text-[#cccccc] font-medium mb-1">Total Ganho</p>
                <p className="text-2xl font-bold text-[#ff6666]">
                  R$ {earningsData.totalEarnings.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-4 text-center border border-[#2a2a2a]">
                <p className="text-xs text-[#999999] font-medium mb-1">Atendimentos</p>
                <p className="text-2xl font-bold text-white">{earningsData.totalCompleted}</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-4 text-center border border-[#2a2a2a]">
                <p className="text-xs text-[#999999] font-medium mb-1">Ticket Médio</p>
                <p className="text-2xl font-bold text-white">
                  R$ {earningsData.avgEarnings.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>

            {/* Breakdown by service */}
            {earningsData.byService.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-[#666666] uppercase tracking-wider mb-3">
                  Por serviço
                </p>
                <ul className="space-y-2">
                  {earningsData.byService.map((svc) => {
                    const pct =
                      earningsData.totalEarnings > 0
                        ? (svc.total / earningsData.totalEarnings) * 100
                        : 0;
                    return (
                      <li key={svc.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white font-medium">{svc.name}</span>
                          <span className="text-sm text-[#999999]">
                            {svc.count}× ·{" "}
                            <span className="font-semibold text-[#cc0000]">
                              R$ {svc.total.toFixed(2).replace(".", ",")}
                            </span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#cc0000] rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div className="text-center py-4">
                <svg className="w-8 h-8 text-[#2a2a2a] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[#666666] text-sm">Nenhum atendimento concluído neste período.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
