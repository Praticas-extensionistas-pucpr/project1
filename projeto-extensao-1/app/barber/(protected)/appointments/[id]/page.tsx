"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useBarberAuth } from "@/lib/contexts/BarberAuthContext";
import StatusBadge from "@/app/barber/_components/StatusBadge";

interface Appointment {
  _id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientNotes?: string;
  serviceId: { _id: string; name: string; durationMinutes: number; price: number; description?: string };
  barberId: { _id: string; name: string; phone: string };
  date: string;
  timeSlot: string;
  endTime: string;
  status: string;
  cancelReason?: string;
  createdAt: string;
}

const TRANSITIONS: Record<string, { label: string; status: string; style: string }[]> = {
  pending: [
    { label: "Confirmar", status: "confirmed", style: "bg-blue-600 hover:bg-blue-700 text-white" },
    { label: "Cancelar", status: "cancelled", style: "bg-red-600 hover:bg-red-700 text-white" },
    { label: "Marcar como Concluído", status: "completed", style: "bg-green-600 hover:bg-green-700 text-white" },
  ],
  confirmed: [
    { label: "Marcar como Concluído", status: "completed", style: "bg-green-600 hover:bg-green-700 text-white" },
    { label: "Cancelar", status: "cancelled", style: "bg-red-600 hover:bg-red-700 text-white" },
  ],
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-zinc-800">{value}</p>
    </div>
  );
}

export default function AppointmentDetailPage() {
  const { token } = useBarberAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal de atualização
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchAppointment = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/barber/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAppointment(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar agendamento");
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  async function handleStatusUpdate() {
    if (!token || !pendingStatus) return;
    if (pendingStatus === "cancelled" && !cancelReason.trim()) {
      setActionError("Informe o motivo do cancelamento.");
      return;
    }
    setSubmitting(true);
    setActionError("");
    try {
      const res = await fetch(`/api/barber/appointments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: pendingStatus,
          ...(pendingStatus === "cancelled" ? { cancelReason: cancelReason.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAppointment(data.data);
      setPendingStatus(null);
      setCancelReason("");
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Erro ao atualizar status");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(d: string) {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 border-3 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 text-sm">{error || "Agendamento não encontrado."}</p>
          <button onClick={() => router.back()} className="mt-3 text-sm text-zinc-500 hover:text-zinc-700">
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  const transitions = TRANSITIONS[appointment.status] ?? [];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/barber/appointments"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar para Agendamentos
      </Link>

      {/* Card principal */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Header do card */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">{appointment.clientName}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {formatDate(appointment.date)} · {appointment.timeSlot} – {appointment.endTime}
            </p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Cliente */}
          <section>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Cliente</h2>
            <div className="space-y-3">
              <InfoRow label="Nome" value={appointment.clientName} />
              <InfoRow label="Telefone" value={appointment.clientPhone} />
              <InfoRow label="E-mail" value={appointment.clientEmail} />
              <InfoRow label="Observações" value={appointment.clientNotes} />
            </div>
          </section>

          {/* Serviço */}
          <section>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Serviço</h2>
            <div className="space-y-3">
              <InfoRow label="Nome" value={appointment.serviceId?.name} />
              <InfoRow label="Duração" value={`${appointment.serviceId?.durationMinutes} minutos`} />
              <InfoRow label="Valor" value={`R$ ${appointment.serviceId?.price},00`} />
              <InfoRow label="Descrição" value={appointment.serviceId?.description} />
            </div>
          </section>

          {/* Agendamento */}
          <section>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Agendamento</h2>
            <div className="space-y-3">
              <InfoRow label="Data" value={formatDate(appointment.date)} />
              <InfoRow label="Horário" value={`${appointment.timeSlot} – ${appointment.endTime}`} />
              <InfoRow label="Criado em" value={new Date(appointment.createdAt).toLocaleString("pt-BR")} />
              {appointment.cancelReason && (
                <InfoRow label="Motivo do cancelamento" value={appointment.cancelReason} />
              )}
            </div>
          </section>
        </div>

        {/* Ações de status */}
        {transitions.length > 0 && (
          <div className="px-6 py-5 bg-zinc-50 border-t border-zinc-100">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Atualizar Status</p>
            <div className="flex flex-wrap gap-2">
              {transitions.map((t) => (
                <button
                  key={t.status}
                  onClick={() => { setPendingStatus(t.status); setActionError(""); setCancelReason(""); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${t.style}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmação */}
      {pendingStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-semibold text-zinc-900 mb-1">
              {pendingStatus === "confirmed" && "Confirmar agendamento?"}
              {pendingStatus === "completed" && "Marcar como concluído?"}
              {pendingStatus === "cancelled" && "Cancelar agendamento?"}
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              {appointment.clientName} · {appointment.serviceId?.name} · {appointment.timeSlot}
            </p>

            {pendingStatus === "cancelled" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Motivo do cancelamento <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Cliente não compareceu"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>
            )}

            {actionError && (
              <p className="text-red-600 text-sm mb-3">{actionError}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setPendingStatus(null); setActionError(""); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {submitting && (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
