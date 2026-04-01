import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Transacao from "@/lib/models/Transacao";
import { requireAuth } from "@/lib/auth";

type Periodo = "hoje" | "semana" | "mes";

function getDateRange(periodo: Periodo): { start: Date; end: Date } {
  const now = new Date();

  if (periodo === "hoje") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (periodo === "semana") {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(now);
    start.setDate(now.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

const FORMA_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  debito: "Débito",
  credito_vista: "Crédito à vista",
};

/**
 * GET /api/barber/transacoes/resumo
 * Query params:
 *   - periodo: hoje | semana | mes (default: hoje)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const { searchParams } = new URL(request.url);

    const raw = searchParams.get("periodo") ?? "hoje";
    const periodo = (["hoje", "semana", "mes"].includes(raw) ? raw : "hoje") as Periodo;

    const { start, end } = getDateRange(periodo);

    await connectDB();

    const all = await Transacao.find({
      barberId: auth.barberId,
      criadoEm: { $gte: start, $lte: end },
    });

    const receitas = all.filter((t) => t.tipo !== "despesa");
    const despesas = all.filter((t) => t.tipo === "despesa");

    const faturamentoBruto = receitas.reduce((s, t) => s + t.valorBruto, 0);
    const totalTaxas = receitas.reduce((s, t) => s + t.valorTaxa, 0);
    const totalDespesas = despesas.reduce((s, t) => s + t.valorBruto, 0);
    const recebidoLiquido = faturamentoBruto - totalTaxas - totalDespesas;
    const ticketMedio = receitas.length > 0 ? faturamentoBruto / receitas.length : 0;

    // Breakdown por forma de pagamento (apenas receitas)
    const formaMap = new Map<
      string,
      { forma: string; label: string; qtd: number; bruto: number; taxa: number; liquido: number }
    >();

    for (const t of receitas) {
      const key = t.formaPagamento;
      const entry = formaMap.get(key) ?? {
        forma: key,
        label: FORMA_LABELS[key] ?? key,
        qtd: 0,
        bruto: 0,
        taxa: 0,
        liquido: 0,
      };
      entry.qtd += 1;
      entry.bruto += t.valorBruto;
      entry.taxa += t.valorTaxa;
      entry.liquido += t.valorLiquido;
      formaMap.set(key, entry);
    }

    const byFormaPagamento = Array.from(formaMap.values()).sort((a, b) => b.bruto - a.bruto);

    return NextResponse.json({
      periodo,
      faturamentoBruto: parseFloat(faturamentoBruto.toFixed(2)),
      totalTaxas: parseFloat(totalTaxas.toFixed(2)),
      totalDespesas: parseFloat(totalDespesas.toFixed(2)),
      recebidoLiquido: parseFloat(recebidoLiquido.toFixed(2)),
      ticketMedio: parseFloat(ticketMedio.toFixed(2)),
      totalReceitas: receitas.length,
      totalDespesasQtd: despesas.length,
      byFormaPagamento,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[GET /api/barber/transacoes/resumo]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
