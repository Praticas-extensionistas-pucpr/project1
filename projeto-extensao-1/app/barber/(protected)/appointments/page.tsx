"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useBarberAuth } from "@/lib/contexts/BarberAuthContext";
import { useNotifications } from "@/lib/contexts/NotificationContext";
import StatusBadge from "@/app/barber/_components/StatusBadge";

// ── Tipos ──────────────────────────────────────────────────────────────────────

type Period = "hoje" | "semana" | "mes";
type FormaPagamento = "dinheiro" | "pix" | "debito" | "credito_vista";

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

// ── Constantes ─────────────────────────────────────────────────────────────────

// Taxas padrão — substituídas pelas taxas reais do barbeiro ao abrir o modal
const TAXAS_PADRAO: Record<FormaPagamento, number> = {
  dinheiro: 0,
  pix: 0,
  debito: 1.99,
  credito_vista: 2.99,
};

const FORMA_LABELS: Record<FormaPagamento, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  debito: "Débito",
  credito_vista: "Crédito à vista",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getDateRange(period: Period): { date?: string; startDate?: string; endDate?: string } {
  const today = new Date();
  if (period === "hoje") return { date: fmt(today) };

  if (period === "semana") {
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { startDate: fmt(monday), endDate: fmt(sunday) };
  }

  // mes
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { startDate: fmt(first), endDate: fmt(last) };
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function fmtBRL(val: number): string {
  return val.toFixed(2).replace(".", ",");
}

// ── Componente ─────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const { token, logout } = useBarberAuth();
  const { newAppointmentsCount, clearNotifications } = useNotifications();

  // Listagem
  const [period, setPeriod] = useState<Period>("hoje");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Ação individual por card
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Modal cancelamento
  const [cancelModal, setCancelModal] = useState<{ id: string; name: string } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Modal conclusão / pagamento
  const [completeModal, setCompleteModal] = useState<Appointment | null>(null);
  const [payValor, setPayValor] = useState("");
  const [payForma, setPayForma] = useState<FormaPagamento>("pix");
  const [payObs, setPayObs] = useState("");
  const [completeLoading, setCompleteLoading] = useState(false);
  const [taxasConfig, setTaxasConfig] = useState<Record<FormaPagamento, number>>(TAXAS_PADRAO);

  // Busca as taxas reais do barbeiro uma vez ao montar
  useEffect(() => {
    if (!token) return;
    fetch("/api/barber/configuracoes/taxas", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.data) {
          setTaxasConfig({
            dinheiro: data.data.taxaDinheiro,
            pix: data.data.taxaPix,
            debito: data.data.taxaDebito,
            credito_vista: data.data.taxaCreditoVista,
          });
        }
      })
      .catch(() => {});
  }, [token]);

  // Debounce da busca
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // Fetch de agendamentos
  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const range = getDateRange(period);
      const params = new URLSearchParams({ limit: "100" });
      if (range.date) params.set("date", range.date);
      if (range.startDate) params.set("startDate", range.startDate);
      if (range.endDate) params.set("endDate", range.endDate);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const res = await fetch(`/api/barber/appointments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { logout(); return; }
        throw new Error(data.error);
      }
      setAppointments(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  }, [token, logout, period, debouncedSearch]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Quando entra na página, limpa notificações
  useEffect(() => {
    clearNotifications();
  }, [clearNotifications]);

  // ── Ações ────────────────────────────────────────────────────────────────────

  async function handleConfirm(id: string) {
    if (!token) return;
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/barber/appointments/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      await fetchAppointments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao confirmar");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleCancelSubmit() {
    if (!cancelModal || !token) return;
    if (!cancelReason.trim()) { alert("Informe o motivo do cancelamento."); return; }
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/barber/appointments/${cancelModal.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancelReason: cancelReason.trim() }),
      });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setCancelModal(null);
      setCancelReason("");
      await fetchAppointments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao cancelar");
    } finally {
      setCancelLoading(false);
    }
  }

  function openCompleteModal(appt: Appointment) {
    setCompleteModal(appt);
    setPayValor(appt.serviceId?.price ? String(appt.serviceId.price) : "");
    setPayForma("pix");
    setPayObs("");
  }

  async function handleCompleteSubmit() {
    if (!completeModal || !token) return;
    const valorNum = parseFloat(payValor.replace(",", "."));
    if (isNaN(valorNum) || valorNum <= 0) { alert("Informe um valor válido."); return; }
    setCompleteLoading(true);
    try {
      const res = await fetch(`/api/barber/appointments/${completeModal._id}/concluir`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          valorCobrado: valorNum,
          formaPagamento: payForma,
          observacao: payObs,
        }),
      });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setCompleteModal(null);
      await fetchAppointments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao concluir");
    } finally {
      setCompleteLoading(false);
    }
  }

  // ── Cálculo em tempo real no modal ───────────────────────────────────────────

  const valorNum = parseFloat((payValor || "0").replace(",", ".")) || 0;
  const taxaPct = taxasConfig[payForma];
  const valorTaxa = parseFloat(((valorNum * taxaPct) / 100).toFixed(2));
  const valorLiquido = parseFloat((valorNum - valorTaxa).toFixed(2));

  // ── Agrupamento por data (semana/mês) ────────────────────────────────────────

  const grouped: { date: string; items: Appointment[] }[] = [];
  if (period === "hoje") {
    grouped.push({ date: fmt(new Date()), items: appointments });
  } else {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const list = map.get(a.date) ?? [];
      list.push(a);
      map.set(a.date, list);
    }
    for (const [date, items] of map) grouped.push({ date, items });
  }

  const totalCount = appointments.length;

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">

      {/* ── Banner de novos agendamentos ─────────────────────────────────────── */}
      {newAppointmentsCount > 0 && (
        <div className="flex items-center justify-between gap-3 bg-[#0047ab] text-white rounded-lg px-4 py-3 mb-5">
          <p className="text-sm font-semibold">
            Você tem {newAppointmentsCount} novo{newAppointmentsCount !== 1 ? "s" : ""} agendamento{newAppointmentsCount !== 1 ? "s" : ""}
          </p>
          <button
            onClick={() => { clearNotifications(); fetchAppointments(); }}
            className="text-xs font-bold uppercase tracking-[0.08em] bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-md transition-colors shrink-0"
          >
            Ver agora
          </button>
        </div>
      )}

      {/* ── Cabeçalho ────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-[#cc0000] text-xs font-bold uppercase tracking-[0.3em] mb-2">Agenda</p>
        <h1 className="font-display text-3xl font-bold text-[#0a0a0a]">Agendamentos</h1>
        {!loading && (
          <p className="text-[#888888] text-sm mt-1">
            {totalCount > 0
              ? `${totalCount} agendamento${totalCount !== 1 ? "s" : ""}`
              : "Nenhum agendamento no período"}
          </p>
        )}
      </div>

      {/* ── Filtros ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Tabs de período */}
        <div className="flex gap-1 p-1 bg-white border border-[#e8e8e8] rounded-lg">
          {(["hoje", "semana", "mes"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-[0.1em] rounded-md transition-colors duration-200 ${
                period === p
                  ? "bg-[#cc0000] text-white"
                  : "text-[#888888] hover:text-[#0a0a0a] hover:bg-[#f5f5f5]"
              }`}
            >
              {p === "hoje" ? "Hoje" : p === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>

        {/* Busca por nome */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome do cliente..."
            className="w-full pl-9 pr-4 py-3 bg-white border border-[#e8e8e8] rounded-lg text-sm text-[#0a0a0a] placeholder-[#aaaaaa] focus:outline-none focus:border-[#0047ab] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#0a0a0a]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Lista ────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#e8e8e8] border-t-[#cc0000] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-white border border-[#e8e8e8] rounded-lg px-5 py-8 text-center text-[#cc0000] text-sm font-medium">
          {error}
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white border border-[#e8e8e8] rounded-lg py-16 text-center">
          <svg className="w-10 h-10 text-[#e8e8e8] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-[#888888] text-sm">Nenhum agendamento encontrado.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ date, items }) => (
            <div key={date}>
              {period !== "hoje" && (
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#888888] mb-3">
                  {formatDateBR(date)}
                </p>
              )}
              <div className="space-y-3">
                {items.map((appt) => (
                  <AppointmentCard
                    key={appt._id}
                    appt={appt}
                    isLoading={actionLoading[appt._id] ?? false}
                    onConfirm={() => handleConfirm(appt._id)}
                    onComplete={() => openCompleteModal(appt)}
                    onCancel={() => {
                      setCancelModal({ id: appt._id, name: appt.clientName });
                      setCancelReason("");
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Cancelamento ────────────────────────────────────────────────── */}
      {cancelModal && (
        <Modal onClose={() => setCancelModal(null)}>
          <h2 className="font-display text-lg font-bold text-[#0a0a0a] mb-1">
            Cancelar agendamento
          </h2>
          <p className="text-sm text-[#888888] mb-5">
            {cancelModal.name}
          </p>
          <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#888888] mb-2">
            Motivo do cancelamento
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Informe o motivo..."
            rows={3}
            className="w-full px-3 py-2.5 bg-[#f5f5f5] border border-[#e8e8e8] rounded-lg text-sm text-[#0a0a0a] placeholder-[#aaaaaa] focus:outline-none focus:border-[#cc0000] resize-none"
          />
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setCancelModal(null)}
              className="flex-1 py-3 border border-[#e8e8e8] rounded-lg text-sm font-semibold text-[#888888] hover:bg-[#f5f5f5] transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleCancelSubmit}
              disabled={cancelLoading}
              className="flex-1 py-3 bg-[#cc0000] text-white rounded-lg text-sm font-bold uppercase tracking-[0.08em] hover:bg-[#aa0000] disabled:opacity-50 transition-colors"
            >
              {cancelLoading ? "Cancelando..." : "Confirmar"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal Conclusão / Pagamento ──────────────────────────────────────── */}
      {completeModal && (
        <Modal onClose={() => setCompleteModal(null)}>
          <h2 className="font-display text-lg font-bold text-[#0a0a0a] mb-1">
            Registrar pagamento
          </h2>
          <p className="text-sm text-[#888888] mb-5">
            {completeModal.clientName} · {completeModal.serviceId?.name}
          </p>

          {/* Valor cobrado */}
          <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#888888] mb-2">
            Valor cobrado (R$)
          </label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={payValor}
            onChange={(e) => setPayValor(e.target.value)}
            className="w-full px-3 py-3 bg-[#f5f5f5] border border-[#e8e8e8] rounded-lg text-base font-bold text-[#0a0a0a] focus:outline-none focus:border-[#0047ab] mb-5"
          />

          {/* Forma de pagamento */}
          <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#888888] mb-2">
            Forma de pagamento
          </label>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {(["dinheiro", "pix", "debito", "credito_vista"] as FormaPagamento[]).map((f) => (
              <button
                key={f}
                onClick={() => setPayForma(f)}
                className={`py-3 rounded-lg text-sm font-bold border transition-colors duration-150 ${
                  payForma === f
                    ? "bg-[#0047ab] border-[#0047ab] text-white"
                    : "bg-white border-[#e8e8e8] text-[#888888] hover:border-[#0047ab] hover:text-[#0047ab]"
                }`}
              >
                {FORMA_LABELS[f]}
              </button>
            ))}
          </div>

          {/* Resumo de taxas */}
          <div className="bg-[#f5f5f5] border border-[#e8e8e8] rounded-lg p-4 mb-5 space-y-2">
            <div className="flex justify-between text-xs text-[#888888]">
              <span>Taxa {taxaPct > 0 ? `(${taxaPct}%)` : ""}</span>
              <span className="font-semibold text-[#cc0000]">- R$ {fmtBRL(valorTaxa)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#0a0a0a] pt-2 border-t border-[#e8e8e8]">
              <span>Valor líquido</span>
              <span className="text-green-700">R$ {fmtBRL(valorLiquido)}</span>
            </div>
          </div>

          {/* Observação */}
          <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#888888] mb-2">
            Observação (opcional)
          </label>
          <input
            type="text"
            value={payObs}
            onChange={(e) => setPayObs(e.target.value)}
            placeholder="Ex.: inclui barba"
            className="w-full px-3 py-2.5 bg-[#f5f5f5] border border-[#e8e8e8] rounded-lg text-sm text-[#0a0a0a] placeholder-[#aaaaaa] focus:outline-none focus:border-[#0047ab] mb-5"
          />

          <button
            onClick={handleCompleteSubmit}
            disabled={completeLoading || valorNum <= 0}
            className="w-full py-4 bg-[#cc0000] text-white rounded-lg text-sm font-bold uppercase tracking-[0.1em] hover:bg-[#aa0000] disabled:opacity-50 transition-colors"
          >
            {completeLoading ? "Registrando..." : "Confirmar pagamento"}
          </button>
        </Modal>
      )}
    </div>
  );
}

// ── Card de agendamento ────────────────────────────────────────────────────────

function AppointmentCard({
  appt,
  isLoading,
  onConfirm,
  onComplete,
  onCancel,
}: {
  appt: Appointment;
  isLoading: boolean;
  onConfirm: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const isActive = appt.status === "pending" || appt.status === "confirmed";

  return (
    <div className="bg-white border border-[#e8e8e8] rounded-lg overflow-hidden">
      {/* Info principal */}
      <div className="flex items-start gap-4 p-4">
        {/* Horário */}
        <div className="text-center min-w-[52px] shrink-0 mt-0.5">
          <p className="font-display font-bold text-[#0a0a0a] text-base leading-none">
            {appt.timeSlot}
          </p>
          <p className="text-[#888888] text-xs mt-1">{appt.endTime}</p>
        </div>

        <div className="w-px self-stretch bg-[#e8e8e8] shrink-0" />

        {/* Dados */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-[#0a0a0a] text-sm truncate">{appt.clientName}</p>
            <StatusBadge status={appt.status} />
          </div>
          <p className="text-[#888888] text-xs mt-1 truncate">
            {appt.serviceId?.name}
            {appt.serviceId?.durationMinutes ? ` · ${appt.serviceId.durationMinutes} min` : ""}
            {appt.serviceId?.price != null ? ` · R$ ${fmtBRL(appt.serviceId.price)}` : ""}
          </p>
          <p className="text-[#aaaaaa] text-xs mt-1">{appt.clientPhone}</p>
        </div>
      </div>

      {/* Botões de ação */}
      {isActive && (
        <div className={`flex border-t border-[#e8e8e8] divide-x divide-[#e8e8e8] ${isLoading ? "opacity-60 pointer-events-none" : ""}`}>
          {appt.status === "pending" && (
            <button
              onClick={onConfirm}
              className="flex-1 py-3 text-xs font-bold uppercase tracking-[0.08em] text-[#0047ab] hover:bg-[#f5f5f5] transition-colors"
            >
              Confirmar
            </button>
          )}
          <button
            onClick={onComplete}
            className="flex-1 py-3 text-xs font-bold uppercase tracking-[0.08em] text-green-700 hover:bg-[#f5f5f5] transition-colors"
          >
            Concluir
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-xs font-bold uppercase tracking-[0.08em] text-[#cc0000] hover:bg-[#f5f5f5] transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Modal wrapper ──────────────────────────────────────────────────────────────

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
