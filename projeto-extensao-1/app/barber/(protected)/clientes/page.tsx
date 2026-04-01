"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useBarberAuth } from "@/lib/contexts/BarberAuthContext";

interface Cliente {
  _id: string;
  nome: string;
  telefone: string;
  ultimoCorte?: string;
  totalServicos: number;
  observacoes?: string;
  servicosFavoritos: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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

// ── NovoClienteSheet ────────────────────────────────────────────────────────────

function NovoClienteSheet({
  open,
  onClose,
  onSaved,
  token,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (c: Cliente) => void;
  token: string;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setNome(""); setTelefone(""); setDataNascimento(""); setObservacoes(""); setError("");
  }

  async function handleSave() {
    if (!nome.trim()) { setError("Nome é obrigatório."); return; }
    if (!telefone.trim()) { setError("Telefone é obrigatório."); return; }
    setError(""); setSaving(true);
    try {
      const res = await fetch("/api/barber/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: telefone.trim(),
          dataNascimento: dataNascimento || undefined,
          observacoes: observacoes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      onSaved(data.data);
      reset();
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
      <div className="absolute inset-0 bg-black/40" onClick={() => { reset(); onClose(); }} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-[#e8e8e8] rounded-full" />
        </div>

        <div className="px-6 pt-4 pb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-xl font-bold text-[#0a0a0a]">Novo Cliente</h3>
            <button
              onClick={() => { reset(); onClose(); }}
              className="p-2 text-[#888888] hover:text-[#0a0a0a] transition-colors"
            >
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
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                autoComplete="name"
                className="w-full px-4 py-3 border-2 border-[#e8e8e8] focus:outline-none focus:border-[#cc0000] text-sm transition-colors min-h-[52px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#0a0a0a] mb-2">
                Telefone <span className="text-[#cc0000]">*</span>
              </label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(maskPhone(e.target.value))}
                placeholder="(41) 99999-9999"
                inputMode="numeric"
                className="w-full px-4 py-3 border-2 border-[#e8e8e8] focus:outline-none focus:border-[#cc0000] text-sm transition-colors min-h-[52px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#0a0a0a] mb-2">
                Nascimento{" "}
                <span className="text-[#888888] font-normal normal-case tracking-normal">(opcional)</span>
              </label>
              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#e8e8e8] focus:outline-none focus:border-[#cc0000] text-sm transition-colors min-h-[52px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#0a0a0a] mb-2">
                Observações{" "}
                <span className="text-[#888888] font-normal normal-case tracking-normal">(opcional)</span>
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: prefere degradê baixo, alérgico a álcool..."
                rows={3}
                maxLength={500}
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
              {saving ? "Salvando..." : "Salvar Cliente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ClientesPage() {
  const { token } = useBarberAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchClientes = useCallback(
    async (q?: string) => {
      if (!token) return;
      setLoading(true);
      try {
        const qs = q ? `?q=${encodeURIComponent(q)}` : "";
        const res = await fetch(`/api/barber/clientes${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setClientes(data.data ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  // Busca com debounce
  useEffect(() => {
    const t = setTimeout(() => fetchClientes(search || undefined), 350);
    return () => clearTimeout(t);
  }, [search, fetchClientes]);

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[#cc0000] text-xs font-bold uppercase tracking-[0.3em] mb-1">CRM</p>
          <h1 className="font-display text-3xl font-bold text-[#0a0a0a]">Clientes</h1>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-2 bg-[#cc0000] text-white text-xs font-bold uppercase tracking-[0.15em] px-5 py-3 hover:bg-[#aa0000] transition-colors min-h-[48px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Novo
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888] pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full pl-11 pr-4 py-3 border-2 border-[#e8e8e8] bg-white focus:outline-none focus:border-[#cc0000] text-sm transition-colors min-h-[48px]"
        />
      </div>

      {/* Contagem */}
      {!loading && (
        <p className="text-[#888888] text-xs font-medium uppercase tracking-[0.15em] mb-4">
          {clientes.length} cliente{clientes.length !== 1 ? "s" : ""}
          {search ? ` para "${search}"` : ""}
        </p>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#e8e8e8] border-t-[#cc0000] rounded-full animate-spin" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-20 bg-[#f5f5f5] border border-[#e8e8e8]">
          <svg className="w-10 h-10 text-[#cccccc] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-[#888888] text-sm mb-1">
            {search ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
          </p>
          {!search && (
            <button
              onClick={() => setSheetOpen(true)}
              className="text-[#cc0000] text-sm font-bold mt-2 hover:underline"
            >
              Cadastrar primeiro cliente →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {clientes.map((c) => (
            <Link
              key={c._id}
              href={`/barber/clientes/${c._id}`}
              className="bg-white border border-[#e8e8e8] p-4 hover:border-[#cc0000] transition-all duration-150 flex items-center gap-4 group"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-[#0a0a0a] text-white font-bold text-sm flex items-center justify-center shrink-0 group-hover:bg-[#cc0000] transition-colors duration-150">
                {initials(c.nome)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#0a0a0a] truncate text-sm">{c.nome}</p>
                <p className="text-[#888888] text-xs truncate mt-0.5">{c.telefone}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs bg-[#f5f5f5] border border-[#e8e8e8] px-2 py-0.5 text-[#888888]">
                    {c.totalServicos} visita{c.totalServicos !== 1 ? "s" : ""}
                  </span>
                  {c.ultimoCorte && (
                    <span className="text-xs text-[#888888]">
                      Últ.: {formatDate(c.ultimoCorte)}
                    </span>
                  )}
                </div>
              </div>

              <svg className="w-4 h-4 text-[#cccccc] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      {/* Sheet */}
      <NovoClienteSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={(c) => setClientes((prev) => [c, ...prev])}
        token={token!}
      />
    </div>
  );
}
