"use client";

import { useState, useEffect, useCallback } from "react";
import { useBarberAuth } from "@/lib/contexts/BarberAuthContext";

// ── Tipos ──────────────────────────────────────────────────────────────────────

type Periodo = "hoje" | "semana" | "mes";
type FormaPagamento = "dinheiro" | "pix" | "debito" | "credito_vista";

interface ResumoData {
  faturamentoBruto: number;
  totalTaxas: number;
  totalDespesas: number;
  recebidoLiquido: number;
  ticketMedio: number;
  totalReceitas: number;
  byFormaPagamento: {
    forma: string;
    label: string;
    qtd: number;
    bruto: number;
    taxa: number;
    liquido: number;
  }[];
}

interface Transacao {
  _id: string;
  tipo: string;
  descricao: string;
  valorBruto: number;
  formaPagamento: FormaPagamento;
  taxaPercentual: number;
  valorTaxa: number;
  valorLiquido: number;
  categoria: string;
  criadoEm: string;
}

interface TaxasConfig {
  taxaDebito: number;
  taxaCreditoVista: number;
  taxaCreditoParcelado: number;
  taxaPix: number;
  taxaDinheiro: number;
}

// ── Constantes ─────────────────────────────────────────────────────────────────

const PERIODO_LABELS: Record<Periodo, string> = {
  hoje: "Hoje",
  semana: "Semana",
  mes: "Mês",
};

const FORMA_LABELS: Record<FormaPagamento, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  debito: "Débito",
  credito_vista: "Crédito à vista",
};

const CATEGORIAS = ["corte", "barba", "combo", "produto", "outros"];

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtBRL(val: number): string {
  return val.toFixed(2).replace(".", ",");
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportCSV(transactions: Transacao[], periodo: Periodo) {
  const headers = [
    "Data/Hora",
    "Descrição",
    "Tipo",
    "Forma de Pagamento",
    "Valor Bruto",
    "Taxa (R$)",
    "Valor Líquido",
  ];
  const rows = transactions.map((t) => [
    new Date(t.criadoEm).toLocaleString("pt-BR"),
    t.descricao,
    t.tipo,
    FORMA_LABELS[t.formaPagamento] ?? t.formaPagamento,
    t.valorBruto.toFixed(2),
    t.valorTaxa.toFixed(2),
    t.valorLiquido.toFixed(2),
  ]);
  const csv =
    "\uFEFF" +
    [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `caixa-${periodo}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function CaixaPage() {
  const { token, logout } = useBarberAuth();

  const [periodo, setPeriodo] = useState<Periodo>("hoje");
  const [resumo, setResumo] = useState<ResumoData | null>(null);
  const [transactions, setTransactions] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal lançamento manual
  const [manualModal, setManualModal] = useState(false);
  const [manualTipo, setManualTipo] = useState<"venda_balcao" | "despesa">("venda_balcao");
  const [manualDesc, setManualDesc] = useState("");
  const [manualValor, setManualValor] = useState("");
  const [manualForma, setManualForma] = useState<FormaPagamento>("pix");
  const [manualCat, setManualCat] = useState("outros");
  const [manualLoading, setManualLoading] = useState(false);

  // Modal configurar taxas
  const [taxasModal, setTaxasModal] = useState(false);
  const [taxasForm, setTaxasForm] = useState<TaxasConfig>({
    taxaDebito: 1.99,
    taxaCreditoVista: 2.99,
    taxaCreditoParcelado: 3.99,
    taxaPix: 0,
    taxaDinheiro: 0,
  });
  const [taxasLoading, setTaxasLoading] = useState(false);
  const [taxasMensalPerdido, setTaxasMensalPerdido] = useState<number | null>(null);

  // ── Fetch dados ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [resumoRes, transacoesRes] = await Promise.all([
        fetch(`/api/barber/transacoes/resumo?periodo=${periodo}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/barber/transacoes?periodo=${periodo}&limit=200`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (resumoRes.status === 401 || transacoesRes.status === 401) {
        logout();
        return;
      }

      const [resumoData, transacoesData] = await Promise.all([
        resumoRes.json(),
        transacoesRes.json(),
      ]);

      if (!resumoRes.ok) throw new Error(resumoData.error);
      if (!transacoesRes.ok) throw new Error(transacoesData.error);

      setResumo(resumoData);
      setTransactions(transacoesData.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [token, logout, periodo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchTaxas = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/barber/configuracoes/taxas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.data) setTaxasForm(data.data);
    } catch {}
  }, [token]);

  // Busca perdido mensal para a mensagem no modal de taxas
  const fetchPerdidoMensal = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/barber/transacoes/resumo?periodo=mes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setTaxasMensalPerdido(data.totalTaxas ?? 0);
    } catch {}
  }, [token]);

  function openTaxasModal() {
    fetchTaxas();
    fetchPerdidoMensal();
    setTaxasModal(true);
  }

  // ── Ações ────────────────────────────────────────────────────────────────────

  async function handleManualSubmit() {
    if (!token) return;
    if (!manualDesc.trim()) { alert("Informe a descrição."); return; }
    const valor = parseFloat(manualValor.replace(",", "."));
    if (isNaN(valor) || valor <= 0) { alert("Informe um valor válido."); return; }

    setManualLoading(true);
    try {
      const res = await fetch("/api/barber/transacoes", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: manualTipo,
          descricao: manualDesc.trim(),
          valorBruto: valor,
          formaPagamento: manualForma,
          categoria: manualCat,
        }),
      });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setManualModal(false);
      setManualDesc("");
      setManualValor("");
      setManualForma("pix");
      setManualCat("outros");
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao registrar");
    } finally {
      setManualLoading(false);
    }
  }

  async function handleTaxasSave() {
    if (!token) return;
    setTaxasLoading(true);
    try {
      const res = await fetch("/api/barber/configuracoes/taxas", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(taxasForm),
      });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setTaxasModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao salvar taxas");
    } finally {
      setTaxasLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-[#cc0000] text-xs font-bold uppercase tracking-[0.3em] mb-2">
            Financeiro
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0a0a0a]">Caixa</h1>
        </div>

        {/* Ações rápidas */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setManualModal(true);
              setManualTipo("venda_balcao");
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#cc0000] text-white rounded-lg text-sm font-bold uppercase tracking-[0.08em] hover:bg-[#aa0000] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Lançamento
          </button>
          <button
            onClick={openTaxasModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e8e8e8] text-[#0a0a0a] rounded-lg text-sm font-semibold hover:bg-[#f5f5f5] transition-colors"
          >
            <svg className="w-4 h-4 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Taxas
          </button>
          {transactions.length > 0 && (
            <button
              onClick={() => exportCSV(transactions, periodo)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e8e8e8] text-[#0a0a0a] rounded-lg text-sm font-semibold hover:bg-[#f5f5f5] transition-colors"
            >
              <svg className="w-4 h-4 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
          )}
        </div>
      </div>

      {/* ── Filtro de período ── */}
      <div className="flex gap-1 p-1 bg-white border border-[#e8e8e8] rounded-lg mb-6 max-w-xs">
        {(["hoje", "semana", "mes"] as Periodo[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-[0.1em] rounded-md transition-colors duration-200 ${
              periodo === p
                ? "bg-[#cc0000] text-white"
                : "text-[#888888] hover:text-[#0a0a0a] hover:bg-[#f5f5f5]"
            }`}
          >
            {PERIODO_LABELS[p]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#e8e8e8] border-t-[#cc0000] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-white border border-[#e8e8e8] rounded-lg px-5 py-8 text-center text-[#cc0000] text-sm">
          {error}
        </div>
      ) : (
        <>
          {/* ── Cards de resumo ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <SummaryCard
              label="Faturamento bruto"
              value={`R$ ${fmtBRL(resumo?.faturamentoBruto ?? 0)}`}
              borderColor="border-t-[#0047ab]"
              valueColor="text-[#0047ab]"
            />
            <SummaryCard
              label="Total de taxas"
              value={`R$ ${fmtBRL(resumo?.totalTaxas ?? 0)}`}
              borderColor="border-t-[#cc0000]"
              valueColor="text-[#cc0000]"
              sub="para a maquininha"
            />
            <SummaryCard
              label="Recebido líquido"
              value={`R$ ${fmtBRL(resumo?.recebidoLiquido ?? 0)}`}
              borderColor="border-t-green-500"
              valueColor="text-green-600"
              sub="no bolso"
            />
            <SummaryCard
              label="Ticket médio"
              value={`R$ ${fmtBRL(resumo?.ticketMedio ?? 0)}`}
              borderColor="border-t-amber-400"
              valueColor="text-amber-600"
            />
          </div>

          {/* ── Breakdown por forma de pagamento ── */}
          {(resumo?.byFormaPagamento?.length ?? 0) > 0 && (
            <div className="bg-white border border-[#e8e8e8] rounded-lg mb-6 overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e8e8e8]">
                <h2 className="text-[#0a0a0a] font-bold text-sm uppercase tracking-[0.15em]">
                  Por forma de pagamento
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f5f5f5] border-b border-[#e8e8e8]">
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#888888]">
                        Forma
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#888888]">
                        Qtd
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#888888]">
                        Bruto
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#888888]">
                        Taxa
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#888888]">
                        Líquido
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8e8e8]">
                    {resumo!.byFormaPagamento.map((row) => (
                      <tr key={row.forma} className="hover:bg-[#f5f5f5] transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-[#0a0a0a]">{row.label}</td>
                        <td className="px-4 py-3.5 text-right text-[#888888]">{row.qtd}×</td>
                        <td className="px-4 py-3.5 text-right text-[#0a0a0a] tabular-nums">
                          R$ {fmtBRL(row.bruto)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-[#cc0000] tabular-nums">
                          {row.taxa > 0 ? `- R$ ${fmtBRL(row.taxa)}` : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-green-700 tabular-nums">
                          R$ {fmtBRL(row.liquido)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Lista de transações ── */}
          <div className="bg-white border border-[#e8e8e8] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
              <h2 className="text-[#0a0a0a] font-bold text-sm uppercase tracking-[0.15em]">
                Transações
              </h2>
              <span className="text-[#888888] text-xs">
                {transactions.length} registro{transactions.length !== 1 ? "s" : ""}
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-[#888888] text-sm">Nenhuma transação no período.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#e8e8e8]">
                {transactions.map((t) => (
                  <TransactionItem key={t._id} t={t} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* ── Modal Lançamento Manual ── */}
      {manualModal && (
        <Modal onClose={() => setManualModal(false)}>
          <h2 className="font-display text-lg font-bold text-[#0a0a0a] mb-5">
            Lançamento manual
          </h2>

          {/* Tipo */}
          <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#888888] mb-2">
            Tipo
          </label>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {(["venda_balcao", "despesa"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setManualTipo(t)}
                className={`py-3 rounded-lg text-sm font-bold border transition-colors ${
                  manualTipo === t
                    ? t === "despesa"
                      ? "bg-[#cc0000] border-[#cc0000] text-white"
                      : "bg-[#0047ab] border-[#0047ab] text-white"
                    : "bg-white border-[#e8e8e8] text-[#888888] hover:border-[#0047ab]"
                }`}
              >
                {t === "venda_balcao" ? "Receita" : "Despesa"}
              </button>
            ))}
          </div>

          {/* Descrição */}
          <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#888888] mb-2">
            Descrição
          </label>
          <input
            type="text"
            value={manualDesc}
            onChange={(e) => setManualDesc(e.target.value)}
            placeholder={manualTipo === "despesa" ? "Ex.: Compra de produtos" : "Ex.: Pigmentação"}
            className="w-full px-3 py-2.5 bg-[#f5f5f5] border border-[#e8e8e8] rounded-lg text-sm focus:outline-none focus:border-[#0047ab] mb-4"
          />

          {/* Valor */}
          <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#888888] mb-2">
            Valor (R$)
          </label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={manualValor}
            onChange={(e) => setManualValor(e.target.value)}
            className="w-full px-3 py-3 bg-[#f5f5f5] border border-[#e8e8e8] rounded-lg text-base font-bold focus:outline-none focus:border-[#0047ab] mb-4"
          />

          {/* Forma de pagamento */}
          <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#888888] mb-2">
            Forma de pagamento
          </label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(["dinheiro", "pix", "debito", "credito_vista"] as FormaPagamento[]).map((f) => (
              <button
                key={f}
                onClick={() => setManualForma(f)}
                className={`py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                  manualForma === f
                    ? "bg-[#0047ab] border-[#0047ab] text-white"
                    : "bg-white border-[#e8e8e8] text-[#888888] hover:border-[#0047ab]"
                }`}
              >
                {FORMA_LABELS[f]}
              </button>
            ))}
          </div>

          {/* Categoria */}
          <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#888888] mb-2">
            Categoria
          </label>
          <select
            value={manualCat}
            onChange={(e) => setManualCat(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#f5f5f5] border border-[#e8e8e8] rounded-lg text-sm focus:outline-none focus:border-[#0047ab] mb-5 capitalize"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>

          <button
            onClick={handleManualSubmit}
            disabled={manualLoading}
            className="w-full py-4 bg-[#cc0000] text-white rounded-lg text-sm font-bold uppercase tracking-[0.1em] hover:bg-[#aa0000] disabled:opacity-50 transition-colors"
          >
            {manualLoading ? "Registrando..." : "Registrar lançamento"}
          </button>
        </Modal>
      )}

      {/* ── Modal Configurar Taxas ── */}
      {taxasModal && (
        <Modal onClose={() => setTaxasModal(false)}>
          <h2 className="font-display text-lg font-bold text-[#0a0a0a] mb-1">
            Configurar taxas
          </h2>
          <p className="text-sm text-[#888888] mb-5">
            Defina a taxa de cada forma de pagamento.
          </p>

          {/* Mensagem de perda mensal */}
          {taxasMensalPerdido !== null && taxasMensalPerdido > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5">
              <p className="text-xs font-semibold text-amber-800">
                Com suas taxas atuais, você perdeu{" "}
                <span className="font-bold text-[#cc0000]">
                  R$ {fmtBRL(taxasMensalPerdido)}
                </span>{" "}
                este mês em taxas de maquininha.
              </p>
            </div>
          )}

          <div className="space-y-4 mb-5">
            {[
              { key: "taxaDebito" as keyof TaxasConfig, label: "Taxa Débito" },
              { key: "taxaCreditoVista" as keyof TaxasConfig, label: "Taxa Crédito à vista" },
              { key: "taxaCreditoParcelado" as keyof TaxasConfig, label: "Taxa Crédito parcelado" },
              { key: "taxaPix" as keyof TaxasConfig, label: "Taxa PIX" },
              { key: "taxaDinheiro" as keyof TaxasConfig, label: "Taxa Dinheiro" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#888888] mb-1.5">
                  {label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxasForm[key]}
                    onChange={(e) =>
                      setTaxasForm((prev) => ({
                        ...prev,
                        [key]: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="flex-1 px-3 py-2.5 bg-[#f5f5f5] border border-[#e8e8e8] rounded-lg text-sm font-bold focus:outline-none focus:border-[#0047ab]"
                  />
                  <span className="text-[#888888] text-sm font-semibold">%</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleTaxasSave}
            disabled={taxasLoading}
            className="w-full py-4 bg-[#cc0000] text-white rounded-lg text-sm font-bold uppercase tracking-[0.1em] hover:bg-[#aa0000] disabled:opacity-50 transition-colors"
          >
            {taxasLoading ? "Salvando..." : "Salvar configurações"}
          </button>
        </Modal>
      )}
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  borderColor,
  valueColor,
  sub,
}: {
  label: string;
  value: string;
  borderColor: string;
  valueColor: string;
  sub?: string;
}) {
  return (
    <div className={`bg-white border-t-4 ${borderColor} border border-[#e8e8e8] p-4 rounded-lg`}>
      <p className="text-[#888888] text-xs font-bold uppercase tracking-[0.12em] mb-2 leading-tight">
        {label}
      </p>
      <p className={`font-display text-xl sm:text-2xl font-bold tabular-nums ${valueColor}`}>
        {value}
      </p>
      {sub && <p className="text-[#aaaaaa] text-xs mt-1">{sub}</p>}
    </div>
  );
}

function TransactionItem({ t }: { t: Transacao }) {
  const isExpense = t.tipo === "despesa" || t.tipo === "estorno";
  const timeStr = fmtTime(t.criadoEm);

  return (
    <li className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f5f5f5] transition-colors">
      {/* Ícone */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isExpense ? "bg-red-50" : "bg-green-50"
        }`}
      >
        <svg
          className={`w-4 h-4 ${isExpense ? "text-[#cc0000]" : "text-green-600"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isExpense ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          )}
        </svg>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#0a0a0a] truncate">{t.descricao}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[#888888]">{timeStr}</span>
          <span className="text-[#e8e8e8]">·</span>
          <span className="text-xs text-[#888888]">
            {FORMA_LABELS[t.formaPagamento] ?? t.formaPagamento}
          </span>
        </div>
      </div>

      {/* Valores */}
      <div className="text-right shrink-0">
        <p className={`font-bold text-sm tabular-nums ${isExpense ? "text-[#cc0000]" : "text-green-700"}`}>
          {isExpense ? "−" : "+"}R$ {fmtBRL(isExpense ? t.valorBruto : t.valorLiquido)}
        </p>
        {!isExpense && t.valorTaxa > 0 && (
          <p className="text-xs text-[#aaaaaa] tabular-nums">
            bruto R$ {fmtBRL(t.valorBruto)}
          </p>
        )}
      </div>
    </li>
  );
}

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
