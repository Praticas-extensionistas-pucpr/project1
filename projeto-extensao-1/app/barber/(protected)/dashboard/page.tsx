"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useBarberAuth } from "@/lib/contexts/BarberAuthContext";
import StatusBadge from "@/app/barber/_components/StatusBadge";

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
    <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-sm">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color.replace("text-", "bg-").replace("-600", "-100").replace("-700", "-100")}`}>
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

  const today = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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

  const activeAppointments = appointments
    .filter((a) => a.status === "pending" || a.status === "confirmed")
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">
          Olá, {barber?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-zinc-500 mt-1 capitalize">{todayFormatted}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Aguardando"
          value={stats.pending}
          color="text-yellow-600"
          icon={
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Confirmados"
          value={stats.confirmed}
          color="text-blue-600"
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Concluídos"
          value={stats.completed}
          color="text-green-600"
          icon={
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <StatCard
          label="Cancelados"
          value={stats.cancelled}
          color="text-red-600"
          icon={
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
        />
      </div>

      {/* Agenda do dia */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="font-semibold text-zinc-900">Agenda de Hoje</h2>
          <Link
            href="/barber/appointments"
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Ver todos →
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-7 h-7 border-3 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500 text-sm">{error}</div>
        ) : activeAppointments.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="w-10 h-10 text-zinc-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-zinc-400 text-sm">Nenhum agendamento ativo para hoje.</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-50">
            {activeAppointments.map((appt) => (
              <li key={appt._id}>
                <Link
                  href={`/barber/appointments/${appt._id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors"
                >
                  {/* Horário */}
                  <div className="text-center min-w-[52px]">
                    <p className="text-base font-bold text-zinc-900">{appt.timeSlot}</p>
                    <p className="text-xs text-zinc-400">{appt.endTime}</p>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-10 bg-zinc-200" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 truncate">{appt.clientName}</p>
                    <p className="text-sm text-zinc-500 truncate">
                      {appt.serviceId?.name} · {appt.serviceId?.durationMinutes} min · R$ {appt.serviceId?.price}
                    </p>
                  </div>

                  <StatusBadge status={appt.status} />

                  <svg className="w-4 h-4 text-zinc-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
