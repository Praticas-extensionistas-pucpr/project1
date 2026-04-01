import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Transacao from "@/lib/models/Transacao";
import Configuracao from "@/lib/models/Configuracao";
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

  // mes
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * GET /api/barber/transacoes
 * Query params:
 *   - periodo: hoje | semana | mes (default: hoje)
 *   - page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const { searchParams } = new URL(request.url);

    const raw = searchParams.get("periodo") ?? "hoje";
    const periodo = (["hoje", "semana", "mes"].includes(raw) ? raw : "hoje") as Periodo;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "100", 10)));
    const skip = (page - 1) * limit;

    const { start, end } = getDateRange(periodo);

    await connectDB();

    const [data, total] = await Promise.all([
      Transacao.find({
        barberId: auth.barberId,
        criadoEm: { $gte: start, $lte: end },
      })
        .sort({ criadoEm: -1 })
        .skip(skip)
        .limit(limit),
      Transacao.countDocuments({
        barberId: auth.barberId,
        criadoEm: { $gte: start, $lte: end },
      }),
    ]);

    return NextResponse.json({
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[GET /api/barber/transacoes]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

/**
 * POST /api/barber/transacoes
 * Cria uma transação manual (receita avulsa ou despesa).
 *
 * Body:
 *   - tipo: "venda_balcao" | "despesa"
 *   - descricao: string
 *   - valorBruto: number
 *   - formaPagamento: string
 *   - categoria?: string
 */
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const body = await request.json();
    const { tipo, descricao, valorBruto, formaPagamento, categoria } = body;

    if (!["venda_balcao", "despesa"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    }
    if (!descricao?.trim()) {
      return NextResponse.json({ error: "Descrição obrigatória." }, { status: 400 });
    }
    if (!valorBruto || typeof valorBruto !== "number" || valorBruto <= 0) {
      return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
    }
    const formasValidas = ["dinheiro", "pix", "debito", "credito_vista"];
    if (!formasValidas.includes(formaPagamento)) {
      return NextResponse.json({ error: "Forma de pagamento inválida." }, { status: 400 });
    }

    await connectDB();

    let taxaPercentual = 0;
    let valorTaxa = 0;

    // Para receitas, aplica taxa conforme configuração do barbeiro
    if (tipo === "venda_balcao") {
      const config = await Configuracao.findOne({ barberId: auth.barberId });
      const taxaMap: Record<string, number> = {
        dinheiro: config?.taxaDinheiro ?? 0,
        pix: config?.taxaPix ?? 0,
        debito: config?.taxaDebito ?? 1.99,
        credito_vista: config?.taxaCreditoVista ?? 2.99,
      };
      taxaPercentual = taxaMap[formaPagamento] ?? 0;
      valorTaxa = parseFloat(((valorBruto * taxaPercentual) / 100).toFixed(2));
    }

    const valorLiquido = parseFloat((valorBruto - valorTaxa).toFixed(2));

    const transacao = await Transacao.create({
      barberId: auth.barberId,
      tipo,
      descricao: descricao.trim(),
      valorBruto,
      formaPagamento,
      taxaPercentual,
      valorTaxa,
      valorLiquido,
      categoria: categoria?.trim() || "outros",
    });

    return NextResponse.json({ data: transacao, message: "Transação registrada." }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[POST /api/barber/transacoes]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
