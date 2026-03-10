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
  clientEmail?: string;
  serviceId: AppointmentService;
  date: string;
  timeSlot: string;
  endTime: string;
  status: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "pending", label: "Aguardando" },
  { value: "confirmed", label: "Confirmados" },
  { value: "completed", label: "Concluídos" },
  { value: "cancelled", label: "Cancelados" },
];

export default function AppointmentsPage() {
  const { token } = useBarberAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Paginação
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filterDate) params.set("date", filterDate);
      if (filterStatus) params.set("status", filterStatus);

      const res = await fetch(`/api/barber/appointments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAppointments(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  }, [token, page, filterDate, filterStatus]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Reset página ao mudar filtros
  useEffect(() => {
    setPage(1);
  }, [filterDate, filterStatus]);

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Agendamentos</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {total > 0 ? `${total} agendamento${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}` : ""}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {(filterDate || filterStatus) && (
          <button
            onClick={() => { setFilterDate(""); setFilterStatus(""); }}
            className="px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-500 hover:bg-zinc-50 transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela / Lista */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-3 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 text-sm">{error}</div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-10 h-10 text-zinc-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-zinc-400 text-sm">Nenhum agendamento encontrado.</p>
          </div>
        ) : (
          <>
            {/* Header da tabela (desktop) */}
            <div className="hidden md:grid grid-cols-[90px_1fr_1fr_120px_100px_40px] gap-4 px-6 py-3 bg-zinc-50 border-b border-zinc-100 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              <span>Data</span>
              <span>Cliente</span>
              <span>Serviço</span>
              <span>Horário</span>
              <span>Status</span>
              <span />
            </div>

            <ul className="divide-y divide-zinc-50">
              {appointments.map((appt) => (
                <li key={appt._id}>
                  <Link
                    href={`/barber/appointments/${appt._id}`}
                    className="flex flex-col md:grid md:grid-cols-[90px_1fr_1fr_120px_100px_40px] gap-2 md:gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors items-start md:items-center"
                  >
                    <span className="text-sm font-medium text-zinc-700">{formatDate(appt.date)}</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{appt.clientName}</p>
                      <p className="text-xs text-zinc-400">{appt.clientPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-700">{appt.serviceId?.name}</p>
                      <p className="text-xs text-zinc-400">
                        {appt.serviceId?.durationMinutes} min · R$ {appt.serviceId?.price}
                      </p>
                    </div>
                    <span className="text-sm text-zinc-700">
                      {appt.timeSlot} – {appt.endTime}
                    </span>
                    <StatusBadge status={appt.status} />
                    <svg className="w-4 h-4 text-zinc-300 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-zinc-500">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
