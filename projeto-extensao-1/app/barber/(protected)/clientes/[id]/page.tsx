"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useBarberAuth } from "@/lib/contexts/BarberAuthContext";

interface Atendimento {
  _id: string;
  servico: string;
  preco: number;
  observacoes?: string;
  data: string;
}

interface ClienteDetalhe {
  _id: string;
  nome: string;
  telefone: string;
  dataNascimento?: string;
  observacoes?: string;
  ultimoCorte?: string;
  totalServicos: number;
  servicosFavoritos: string[];
  historico: Atendimento[];
}

interface ServiceOption {
  _id: string;
  name: string;
  price: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(nome: string) {
  return nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// ── RegistrarAtendimentoModal ──────────────────────────────────────────────────

function RegistrarAtendimentoModal({
  open,
  onClose,
  onSaved,
  clienteId,
  token,
  services,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (a: Atendimento) => void;
  clienteId: string;
  token: string;
  services: ServiceOption[];
}) {
  const [servico, setServico] = useState("");
  const [preco, setPreco] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setServico(""); setPreco(""); setData(new Date().toISOString().split("T")[0]);
    setObservacoes(""); setError("");
  }

  function handleServiceSelect(svc: ServiceOption) {
    setServico(svc.name);
    setPreco(String(svc.price));
  }

  async function handleSave() {
    if (!servico.trim()) { setError("Informe o serviço realizado."); return; }
    const precoNum = parseFloat(preco);
    if (isNaN(precoNum) || precoNum < 0) { setError("Preço inválido."); return; }
    setError(""); setSaving(true);
    try {
      const res = await fetch(`/api/barber/clientes/${clienteId}/atendimentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          servico: servico.trim(),
          preco: precoNum,
          data,
          observacoes: observacoes.trim() || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erro ao registrar");
      onSaved(d.data);
      reset();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao registrar");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => { reset(); onClose(); }} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-[#e8e8e8] rounded-full" />
        </div>

        <div className="px-6 pt-4 pb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-xl font-bold text-[#0a0a0a]">Registrar Atendimento</h3>
            <button onClick={() => { reset(); onClose(); }} className="p-2 text-[#888888] hover:text-[#0a0a0a]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Seleção rápida de serviços */}
            {services.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#888888] mb-2">
                  Seleção rápida
                </label>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => (
                    <button
                      key={s._id}
                      onClick={() => handleServiceSelect(s)}
                      className={`px-3 py-2 text-xs font-semibold border-2 transition-colors min-h-[40px] ${
                        servico === s.name
                          ? "border-[#cc0000] bg-[#fff5f5] text-[#cc0000]"
                          : "border-[#e8e8e8] text-[#0a0a0a] hover:border-[#cc0000]"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#0a0a0a] mb-2">
                Serviço <span className="text-[#cc0000]">*</span>
              </label>
              <input
                type="text"
                value={servico}
                onChange={(e) => setServico(e.target.value)}
                placeholder="Nome do serviço realizado"
                className="w-full px-4 py-3 border-2 border-[#e8e8e8] focus:outline-none focus:border-[#cc0000] text-sm transition-colors min-h-[52px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#0a0a0a] mb-2">
                  Preço (R$) <span className="text-[#cc0000]">*</span>
                </label>
                <input
                  type="number"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="0,00"
                  min={0}
                  step={0.01}
                  inputMode="decimal"
                  className="w-full px-4 py-3 border-2 border-[#e8e8e8] focus:outline-none focus:border-[#cc0000] text-sm transition-colors min-h-[52px]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#0a0a0a] mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#e8e8e8] focus:outline-none focus:border-[#cc0000] text-sm transition-colors min-h-[52px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#0a0a0a] mb-2">
                Observações{" "}
                <span className="text-[#888888] font-normal normal-case tracking-normal">(opcional)</span>
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: cliente pediu degradê mais baixo que o normal..."
                rows={2}
                maxLength={300}
                className="w-full px-4 py-3 border-2 border-[#e8e8e8] focus:outline-none focus:border-[#cc0000] text-sm transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-[#cc0000] text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#cc0000] text-white text-sm font-bold uppercase tracking-[0.15em] py-4 hover:bg-[#aa0000] disabled:opacity-50 transition-colors min-h-[52px]"
            >
              {saving ? "Registrando..." : "Confirmar Atendimento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EditarClienteModal ─────────────────────────────────────────────────────────

function EditarClienteModal({
  open,
  onClose,
  onSaved,
  cliente,
  token,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (c: Partial<ClienteDetalhe>) => void;
  cliente: ClienteDetalhe;
  token: string;
}) {
  const [nome, setNome] = useState(cliente.nome);
  const [telefone, setTelefone] = useState(cliente.telefone);
  const [dataNascimento, setDataNascimento] = useState(
    cliente.dataNascimento ? cliente.dataNascimento.split("T")[0] : ""
  );
  const [observacoes, setObservacoes] = useState(cliente.observacoes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!nome.trim()) { setError("Nome é obrigatório."); return; }
    if (!telefone.trim()) { setError("Telefone é obrigatório."); return; }
    setError(""); setSaving(true);
    try {
      const res = await fetch(`/api/barber/clientes/${cliente._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: telefone.trim(),
          dataNascimento: dataNascimento || null,
          observacoes: observacoes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      onSaved(data.data);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-[#e8e8e8] rounded-full" />
        </div>

        <div className="px-6 pt-4 pb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-xl font-bold text-[#0a0a0a]">Editar Cliente</h3>
            <button onClick={onClose} className="p-2 text-[#888888] hover:text-[#0a0a0a]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#0a0a0a] mb-2">
                Nome <span className="text-[#cc0000]">*</span>
              </label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#e8e8e8] focus:outline-none focus:border-[#cc0000] text-sm transition-colors min-h-[52px]" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#0a0a0a] mb-2">
                Telefone <span className="text-[#cc0000]">*</span>
              </label>
              <input type="tel" value={telefone} onChange={(e) => setTelefone(maskPhone(e.target.value))}
                inputMode="numeric"
                className="w-full px-4 py-3 border-2 border-[#e8e8e8] focus:outline-none focus:border-[#cc0000] text-sm transition-colors min-h-[52px]" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#0a0a0a] mb-2">
                Nascimento <span className="text-[#888888] font-normal normal-case tracking-normal">(opcional)</span>
              </label>
              <input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#e8e8e8] focus:outline-none focus:border-[#cc0000] text-sm transition-colors min-h-[52px]" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#0a0a0a] mb-2">
                Observações <span className="text-[#888888] font-normal normal-case tracking-normal">(opcional)</span>
              </label>
              <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
                rows={3} maxLength={500}
                className="w-full px-4 py-3 border-2 border-[#e8e8e8] focus:outline-none focus:border-[#cc0000] text-sm transition-colors resize-none" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-[#cc0000] text-sm font-medium">{error}</p>
              </div>
            )}

            <button onClick={handleSave} disabled={saving}
              className="w-full bg-[#0a0a0a] text-white text-sm font-bold uppercase tracking-[0.15em] py-4 hover:bg-[#333333] disabled:opacity-50 transition-colors min-h-[52px]">
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Detail Page ────────────────────────────────────────────────────────────────

export default function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { token } = useBarberAuth();

  const [cliente, setCliente] = useState<ClienteDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [modalAtend, setModalAtend] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`/api/barber/clientes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
    ])
      .then(([cd, sv]) => {
        setCliente(cd.data ?? null);
        setServices(sv.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, token]);

  function handleAtendimentoSaved(a: Atendimento) {
    setCliente((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        totalServicos: prev.totalServicos + 1,
        ultimoCorte: a.data,
        historico: [a, ...prev.historico],
      };
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#e8e8e8] border-t-[#cc0000] rounded-full animate-spin" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#888888]">Cliente não encontrado.</p>
        <Link href="/barber/clientes" className="text-[#cc0000] font-bold text-sm mt-3 block hover:underline">
          ← Voltar para Clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/barber/clientes"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[#888888] hover:text-[#0a0a0a] transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Clientes
      </Link>

      {/* Header do cliente */}
      <div className="bg-white border border-[#e8e8e8] p-6 mb-5">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-[#0a0a0a] text-white font-bold text-lg flex items-center justify-center shrink-0">
            {initials(cliente.nome)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold text-[#0a0a0a] leading-tight">
              {cliente.nome}
            </h1>
            <a
              href={`tel:${cliente.telefone.replace(/\D/g, "")}`}
              className="text-[#0047ab] text-sm font-medium mt-1 block hover:underline"
            >
              {cliente.telefone}
            </a>
            {cliente.dataNascimento && (
              <p className="text-[#888888] text-xs mt-1">
                Nascimento: {formatDate(cliente.dataNascimento)}
              </p>
            )}
          </div>

          {/* Edit button */}
          <button
            onClick={() => setModalEdit(true)}
            className="shrink-0 p-2.5 border border-[#e8e8e8] text-[#888888] hover:text-[#0a0a0a] hover:border-[#0a0a0a] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-[#e8e8e8]">
          <div className="text-center">
            <p className="font-display text-3xl font-bold text-[#cc0000]">{cliente.totalServicos}</p>
            <p className="text-[#888888] text-xs uppercase tracking-[0.1em] mt-1">Visitas</p>
          </div>
          <div className="text-center">
            <p className="font-display text-xl font-bold text-[#0a0a0a]">
              {formatDate(cliente.ultimoCorte)}
            </p>
            <p className="text-[#888888] text-xs uppercase tracking-[0.1em] mt-1">Último Corte</p>
          </div>
        </div>

        {/* Serviços favoritos */}
        {cliente.servicosFavoritos.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#e8e8e8]">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#888888] mb-2">Serviços realizados</p>
            <div className="flex flex-wrap gap-2">
              {cliente.servicosFavoritos.map((s) => (
                <span key={s} className="text-xs bg-[#f5f5f5] border border-[#e8e8e8] px-3 py-1 text-[#0a0a0a] font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Observações */}
      {cliente.observacoes && (
        <div className="bg-amber-50 border border-amber-200 px-5 py-4 mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-700 mb-1.5">Observações</p>
          <p className="text-sm text-amber-900 leading-relaxed">{cliente.observacoes}</p>
        </div>
      )}

      {/* CTA Registrar Atendimento */}
      <button
        onClick={() => setModalAtend(true)}
        className="w-full flex items-center justify-center gap-2 bg-[#cc0000] text-white text-sm font-bold uppercase tracking-[0.15em] py-4 hover:bg-[#aa0000] transition-colors min-h-[56px] mb-8"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Registrar Atendimento
      </button>

      {/* Histórico */}
      <div className="bg-white border border-[#e8e8e8]">
        <div className="px-5 py-4 border-b border-[#e8e8e8]">
          <h2 className="font-bold text-sm uppercase tracking-[0.15em] text-[#0a0a0a]">
            Histórico de Atendimentos
          </h2>
        </div>

        {cliente.historico.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[#888888] text-sm">Nenhum atendimento registrado ainda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#e8e8e8]">
            {cliente.historico.map((a) => (
              <li key={a._id} className="px-5 py-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-[#0a0a0a] text-sm">{a.servico}</p>
                  </div>
                  {a.observacoes && (
                    <p className="text-[#888888] text-xs leading-relaxed">{a.observacoes}</p>
                  )}
                  <p className="text-[#888888] text-xs mt-1">{formatDate(a.data)}</p>
                </div>
                <p className="text-[#cc0000] font-bold text-sm shrink-0 tabular-nums">
                  R$ {a.preco.toFixed(2).replace(".", ",")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modals */}
      <RegistrarAtendimentoModal
        open={modalAtend}
        onClose={() => setModalAtend(false)}
        onSaved={handleAtendimentoSaved}
        clienteId={id}
        token={token!}
        services={services}
      />
      {modalEdit && (
        <EditarClienteModal
          open={modalEdit}
          onClose={() => setModalEdit(false)}
          onSaved={(updated) => setCliente((prev) => prev ? { ...prev, ...updated } : prev)}
          cliente={cliente}
          token={token!}
        />
      )}
    </div>
  );
}
