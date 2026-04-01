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

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  borderColor,
  valueColor,
}: {
  label: string;
  value: number;
  borderColor: string;
  valueColor: string;
}) {
  return (
    <div className={`bg-white border-t-4 ${borderColor} border border-[#e8e8e8] p-5 rounded-lg`}>
      <p className="text-[#888888] text-xs font-bold uppercase tracking-[0.15em] mb-3">
        {label}
      </p>
      <p className={`font-display text-4xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { token, barber } = useBarberAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => { fetchTodayAppointments(); }, [fetchTodayAppointments]);
  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);

  const activeAppointments = appointments
    .filter((a) => a.status === "pending" || a.status === "confirmed")
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  const PERIOD_LABELS: Record<EarningsPeriod, string> = {
    today: "Hoje",
    week: "Semana",
    month: "Mês",
  };

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">

      {/* ── Cabeçalho ── */}
      <div className="mb-8">
        <p className="text-[#cc0000] text-xs font-bold uppercase tracking-[0.3em] mb-2">
          Painel
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0a0a0a]">
          Olá, {barber?.name?.split(" ")[0]}.
        </h1>
        <p className="text-[#888888] text-sm mt-1 capitalize">{todayFormatted}</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Aguardando"
          value={stats.pending}
          borderColor="border-t-amber-400"
          valueColor="text-amber-600"
        />
        <StatCard
          label="Confirmados"
          value={stats.confirmed}
          borderColor="border-t-[#0047ab]"
          valueColor="text-[#0047ab]"
        />
        <StatCard
          label="Concluídos"
          value={stats.completed}
          borderColor="border-t-green-500"
          valueColor="text-green-600"
        />
        <StatCard
          label="Cancelados"
          value={stats.cancelled}
          borderColor="border-t-[#cc0000]"
          valueColor="text-[#cc0000]"
        />
      </div>

      {/* ── Agenda do dia ── */}
      <div className="bg-white border border-[#e8e8e8] rounded-lg mb-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
          <h2 className="text-[#0a0a0a] font-bold text-sm uppercase tracking-[0.15em]">
            Agenda de hoje
          </h2>
          <Link
            href="/barber/appointments"
            className="text-xs font-bold uppercase tracking-[0.1em] text-[#0047ab] hover:text-[#cc0000] transition-colors duration-200"
          >
            Ver todos →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-14">
            <div className="w-5 h-5 border-2 border-[#e8e8e8] border-t-[#cc0000] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="px-5 py-8 text-center text-[#cc0000] text-sm font-medium">{error}</div>
        ) : activeAppointments.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-[#888888] text-sm">Nenhum agendamento ativo para hoje.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#e8e8e8]">
            {activeAppointments.map((appt) => (
              <li key={appt._id}>
                <Link
                  href={`/barber/appointments/${appt._id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#f5f5f5] transition-colors duration-200"
                >
                  {/* Horário */}
                  <div className="text-center min-w-[56px] shrink-0">
                    <p className="font-display font-bold text-[#0a0a0a] text-base leading-none">
                      {appt.timeSlot}
                    </p>
                    <p className="text-[#888888] text-xs mt-1">{appt.endTime}</p>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-9 bg-[#e8e8e8] shrink-0" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0a0a0a] truncate text-sm">
                      {appt.clientName}
                    </p>
                    <p className="text-[#888888] text-xs truncate mt-0.5">
                      {appt.serviceId?.name} · {appt.serviceId?.durationMinutes} min · R$ {appt.serviceId?.price}
                    </p>
                  </div>

                  <StatusBadge status={appt.status} />

                  <svg
                    className="w-4 h-4 text-[#cccccc] shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Ganhos ── */}
      <div className="bg-white border border-[#e8e8e8] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
          <h2 className="text-[#0a0a0a] font-bold text-sm uppercase tracking-[0.15em]">
            Ganhos
          </h2>
          {/* Tabs de período */}
          <div className="flex gap-1">
            {(["today", "week", "month"] as EarningsPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setEarningsPeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] rounded transition-colors duration-200 ${
                  earningsPeriod === p
                    ? "bg-[#cc0000] text-white"
                    : "text-[#888888] hover:text-[#0a0a0a] hover:bg-[#f5f5f5]"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {earningsLoading ? (
          <div className="flex justify-center py-14">
            <div className="w-5 h-5 border-2 border-[#e8e8e8] border-t-[#cc0000] rounded-full animate-spin" />
          </div>
        ) : !earningsData ? (
          <div className="px-5 py-8 text-center text-[#cc0000] text-sm font-medium">
            Erro ao carregar ganhos.
          </div>
        ) : (
          <div className="p-5">
            {/* Métricas principais */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-[#f5f5f5] border border-[#e8e8e8] rounded-lg p-4 text-center">
                <p className="text-[#888888] text-xs font-bold uppercase tracking-[0.1em] mb-2">
                  Total ganho
                </p>
                <p className="font-display text-xl sm:text-2xl font-bold text-[#cc0000] tabular-nums">
                  R$ {earningsData.totalEarnings.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="bg-[#f5f5f5] border border-[#e8e8e8] rounded-lg p-4 text-center">
                <p className="text-[#888888] text-xs font-bold uppercase tracking-[0.1em] mb-2">
                  Atendimentos
                </p>
                <p className="font-display text-xl sm:text-2xl font-bold text-[#0a0a0a]">
                  {earningsData.totalCompleted}
                </p>
              </div>
              <div className="bg-[#f5f5f5] border border-[#e8e8e8] rounded-lg p-4 text-center">
                <p className="text-[#888888] text-xs font-bold uppercase tracking-[0.1em] mb-2">
                  Ticket médio
                </p>
                <p className="font-display text-xl sm:text-2xl font-bold text-[#0047ab] tabular-nums">
                  R$ {earningsData.avgEarnings.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>

            {/* Por serviço */}
            {earningsData.byService.length > 0 ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#888888] mb-5">
                  Por serviço
                </p>
                <ul className="space-y-4">
                  {earningsData.byService.map((svc) => {
                    const pct =
                      earningsData.totalEarnings > 0
                        ? (svc.total / earningsData.totalEarnings) * 100
                        : 0;
                    return (
                      <li key={svc.name}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#0a0a0a] text-sm font-semibold">
                            {svc.name}
                          </span>
                          <span className="text-[#888888] text-xs tabular-nums">
                            {svc.count}×{" "}
                            <span className="text-[#cc0000] font-bold">
                              R$ {svc.total.toFixed(2).replace(".", ",")}
                            </span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#e8e8e8] rounded-full overflow-hidden">
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
              <div className="text-center py-6">
                <p className="text-[#888888] text-sm">
                  Nenhum atendimento concluído neste período.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
