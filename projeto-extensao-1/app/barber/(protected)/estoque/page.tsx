"use client";

import { useEffect, useState, useCallback } from "react";
import { useBarberAuth } from "@/lib/contexts/BarberAuthContext";

type Categoria = "insumo" | "venda";
type Unidade = "unidade" | "ml" | "g" | "cx" | "pct";

interface Produto {
  _id: string;
  nome: string;
  categoria: Categoria;
  unidade: Unidade;
  quantidade: number;
  quantidadeMinima: number;
  precoCusto?: number;
  precoVenda?: number;
}

const UNIDADES: { value: Unidade; label: string }[] = [
  { value: "unidade", label: "Unidade" },
  { value: "ml", label: "ml" },
  { value: "g", label: "g" },
  { value: "cx", label: "Caixa" },
  { value: "pct", label: "Pacote" },
];

const EXEMPLOS: Record<Categoria, string> = {
  insumo: "Ex: navalha, lâmina, pomada, shampoo",
  venda: "Ex: cerveja, água, refri, salgadinho",
};

function fmt(v?: number) {
  return v != null
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";
}

export default function EstoquePage() {
  const { token } = useBarberAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<"todos" | Categoria>("todos");
  const [q, setQ] = useState("");

  // Modal cadastro/edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState({
    nome: "",
    categoria: "insumo" as Categoria,
    unidade: "unidade" as Unidade,
    quantidade: "",
    quantidadeMinima: "1",
    precoCusto: "",
    precoVenda: "",
  });

  // Modal movimentação
  const [movModal, setMovModal] = useState(false);
  const [movProduto, setMovProduto] = useState<Produto | null>(null);
  const [movTipo, setMovTipo] = useState<"entrada" | "saida">("entrada");
  const [movQtd, setMovQtd] = useState("");
  const [saving, setSaving] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (aba !== "todos") params.set("categoria", aba);
      if (q) params.set("q", q);
      const res = await fetch(`/api/barber/estoque?${params}`, { headers });
      const json = await res.json();
      setProdutos(json.data ?? []);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, aba, q]);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  function abrirCadastro(produto?: Produto) {
    setEditando(produto ?? null);
    setForm(
      produto
        ? {
            nome: produto.nome,
            categoria: produto.categoria,
            unidade: produto.unidade,
            quantidade: String(produto.quantidade),
            quantidadeMinima: String(produto.quantidadeMinima),
            precoCusto: produto.precoCusto != null ? String(produto.precoCusto) : "",
            precoVenda: produto.precoVenda != null ? String(produto.precoVenda) : "",
          }
        : {
            nome: "",
            categoria: "insumo",
            unidade: "unidade",
            quantidade: "0",
            quantidadeMinima: "1",
            precoCusto: "",
            precoVenda: "",
          }
    );
    setModalOpen(true);
  }

  async function salvar() {
    if (!form.nome.trim()) return alert("Nome obrigatório");
    setSaving(true);
    try {
      const body = {
        nome: form.nome.trim(),
        categoria: form.categoria,
        unidade: form.unidade,
        quantidade: Number(form.quantidade) || 0,
        quantidadeMinima: Number(form.quantidadeMinima) || 1,
        precoCusto: form.precoCusto ? Number(form.precoCusto) : undefined,
        precoVenda: form.precoVenda ? Number(form.precoVenda) : undefined,
      };

      const url = editando
        ? `/api/barber/estoque/${editando._id}`
        : "/api/barber/estoque";
      const method = editando ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const j = await res.json();
        alert(j.error ?? "Erro ao salvar");
        return;
      }

      setModalOpen(false);
      fetchProdutos();
    } finally {
      setSaving(false);
    }
  }

  async function excluir(id: string) {
    if (!confirm("Remover produto do estoque?")) return;
    await fetch(`/api/barber/estoque/${id}`, { method: "DELETE", headers });
    fetchProdutos();
  }

  function abrirMovimentacao(produto: Produto, tipo: "entrada" | "saida") {
    setMovProduto(produto);
    setMovTipo(tipo);
    setMovQtd("");
    setMovModal(true);
  }

  async function registrarMov() {
    if (!movProduto || !movQtd || Number(movQtd) <= 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/barber/estoque/${movProduto._id}/movimentacao`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: movTipo, quantidade: Number(movQtd) }),
      });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error ?? "Erro");
        return;
      }
      setMovModal(false);
      fetchProdutos();
    } finally {
      setSaving(false);
    }
  }

  const emAlerta = produtos.filter((p) => p.quantidade <= p.quantidadeMinima);

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0a0a0a]">Estoque</h1>
          <p className="text-[#888888] text-sm mt-0.5">Insumos e produtos à venda</p>
        </div>
        <button
          onClick={() => abrirCadastro()}
          className="flex items-center gap-2 bg-[#cc0000] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#aa0000] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Produto
        </button>
      </div>

      {/* Alertas de estoque baixo */}
      {emAlerta.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {emAlerta.length} produto{emAlerta.length > 1 ? "s" : ""} com estoque baixo
          </div>
          <div className="flex flex-wrap gap-2">
            {emAlerta.map((p) => (
              <span key={p._id} className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium">
                {p.nome} ({p.quantidade} {p.unidade})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex bg-[#f5f5f5] rounded-lg p-1 gap-1">
          {(["todos", "insumo", "venda"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setAba(cat)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                aba === cat
                  ? "bg-white text-[#cc0000] shadow-sm"
                  : "text-[#888888] hover:text-[#0a0a0a]"
              }`}
            >
              {cat === "todos" ? "Todos" : cat === "insumo" ? "Insumos" : "Venda"}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar produto..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 border border-[#e8e8e8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#cc0000]"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-16 text-[#888888]">Carregando...</div>
      ) : produtos.length === 0 ? (
        <div className="text-center py-16 text-[#888888]">
          <svg className="w-12 h-12 mx-auto mb-3 text-[#e8e8e8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
          </svg>
          <p className="font-semibold">Nenhum produto cadastrado</p>
          <p className="text-sm mt-1">Clique em "Novo Produto" para começar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {produtos.map((p) => {
            const baixo = p.quantidade <= p.quantidadeMinima;
            return (
              <div
                key={p._id}
                className={`flex items-center justify-between bg-white border rounded-xl px-4 py-3 gap-4 ${
                  baixo ? "border-amber-300" : "border-[#e8e8e8]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Badge categoria */}
                  <span
                    className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                      p.categoria === "insumo"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {p.categoria === "insumo" ? "Insumo" : "Venda"}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0a0a0a] truncate">{p.nome}</p>
                    <p className="text-xs text-[#888888]">
                      Mín: {p.quantidadeMinima} {p.unidade}
                      {p.precoVenda != null && ` · Venda: ${fmt(p.precoVenda)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Quantidade */}
                  <div className={`text-right ${baixo ? "text-amber-600" : "text-[#0a0a0a]"}`}>
                    <p className="text-lg font-bold leading-none">{p.quantidade}</p>
                    <p className="text-xs text-[#888888]">{p.unidade}</p>
                  </div>

                  {/* Botões movimentação */}
                  <button
                    onClick={() => abrirMovimentacao(p, "entrada")}
                    title="Entrada"
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => abrirMovimentacao(p, "saida")}
                    title="Saída"
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>

                  {/* Editar */}
                  <button
                    onClick={() => abrirCadastro(p)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#f5f5f5] text-[#888888] hover:text-[#0a0a0a] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  {/* Excluir */}
                  <button
                    onClick={() => excluir(p._id)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#f5f5f5] text-[#888888] hover:text-[#cc0000] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal cadastro/edição */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold text-[#0a0a0a] mb-4">
              {editando ? "Editar Produto" : "Novo Produto"}
            </h2>

            <div className="space-y-4">
              {/* Categoria */}
              <div>
                <label className="block text-sm font-semibold text-[#0a0a0a] mb-1.5">Categoria</label>
                <div className="flex gap-2">
                  {(["insumo", "venda"] as Categoria[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setForm((f) => ({ ...f, categoria: cat }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        form.categoria === cat
                          ? "bg-[#cc0000] text-white border-[#cc0000]"
                          : "border-[#e8e8e8] text-[#888888] hover:border-[#cc0000]"
                      }`}
                    >
                      {cat === "insumo" ? "Insumo" : "Produto de Venda"}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#888888] mt-1">{EXEMPLOS[form.categoria]}</p>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-semibold text-[#0a0a0a] mb-1.5">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Nome do produto"
                  className="w-full border border-[#e8e8e8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#cc0000]"
                />
              </div>

              {/* Unidade + Qtd mínima */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-[#0a0a0a] mb-1.5">Unidade</label>
                  <select
                    value={form.unidade}
                    onChange={(e) => setForm((f) => ({ ...f, unidade: e.target.value as Unidade }))}
                    className="w-full border border-[#e8e8e8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#cc0000]"
                  >
                    {UNIDADES.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-[#0a0a0a] mb-1.5">Estoque mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={form.quantidadeMinima}
                    onChange={(e) => setForm((f) => ({ ...f, quantidadeMinima: e.target.value }))}
                    className="w-full border border-[#e8e8e8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#cc0000]"
                  />
                </div>
              </div>

              {/* Qtd inicial (só no cadastro) */}
              {!editando && (
                <div>
                  <label className="block text-sm font-semibold text-[#0a0a0a] mb-1.5">Quantidade inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={form.quantidade}
                    onChange={(e) => setForm((f) => ({ ...f, quantidade: e.target.value }))}
                    className="w-full border border-[#e8e8e8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#cc0000]"
                  />
                </div>
              )}

              {/* Preços */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-[#0a0a0a] mb-1.5">Preço de custo (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={form.precoCusto}
                    onChange={(e) => setForm((f) => ({ ...f, precoCusto: e.target.value }))}
                    className="w-full border border-[#e8e8e8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#cc0000]"
                  />
                </div>
                {form.categoria === "venda" && (
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[#0a0a0a] mb-1.5">Preço de venda (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={form.precoVenda}
                      onChange={(e) => setForm((f) => ({ ...f, precoVenda: e.target.value }))}
                      className="w-full border border-[#e8e8e8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#cc0000]"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 border border-[#e8e8e8] text-[#888888] py-2.5 rounded-lg text-sm font-semibold hover:bg-[#f5f5f5] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={saving}
                className="flex-1 bg-[#cc0000] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#aa0000] transition-colors disabled:opacity-60"
              >
                {saving ? "Salvando..." : editando ? "Salvar" : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal movimentação */}
      {movModal && movProduto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="text-lg font-bold text-[#0a0a0a] mb-1">
              {movTipo === "entrada" ? "Entrada de Estoque" : "Saída de Estoque"}
            </h2>
            <p className="text-sm text-[#888888] mb-5">{movProduto.nome}</p>

            <div className="bg-[#f5f5f5] rounded-xl p-4 mb-5 text-center">
              <p className="text-xs text-[#888888] uppercase tracking-wide font-semibold">Estoque atual</p>
              <p className="text-3xl font-bold text-[#0a0a0a] mt-1">
                {movProduto.quantidade}
                <span className="text-base font-normal text-[#888888] ml-1">{movProduto.unidade}</span>
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-[#0a0a0a] mb-1.5">
                Quantidade a {movTipo === "entrada" ? "adicionar" : "remover"}
              </label>
              <input
                type="number"
                min="1"
                value={movQtd}
                onChange={(e) => setMovQtd(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-full border border-[#e8e8e8] rounded-lg px-3 py-3 text-xl font-bold text-center focus:outline-none focus:border-[#cc0000]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMovModal(false)}
                className="flex-1 border border-[#e8e8e8] text-[#888888] py-2.5 rounded-lg text-sm font-semibold hover:bg-[#f5f5f5] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={registrarMov}
                disabled={saving || !movQtd || Number(movQtd) <= 0}
                className={`flex-1 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${
                  movTipo === "entrada"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-[#cc0000] hover:bg-[#aa0000]"
                }`}
              >
                {saving ? "Salvando..." : movTipo === "entrada" ? "Confirmar Entrada" : "Confirmar Saída"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
