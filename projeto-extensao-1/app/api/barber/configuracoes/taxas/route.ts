import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Configuracao from "@/lib/models/Configuracao";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/barber/configuracoes/taxas
 * Retorna as taxas configuradas do barbeiro.
 * Cria o registro com defaults caso ainda não exista.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    await connectDB();

    const config = await Configuracao.findOneAndUpdate(
      { barberId: auth.barberId },
      { $setOnInsert: { barberId: auth.barberId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ data: config });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[GET /api/barber/configuracoes/taxas]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

/**
 * PUT /api/barber/configuracoes/taxas
 * Atualiza as taxas do barbeiro.
 *
 * Body (todos opcionais):
 *   - taxaDebito, taxaCreditoVista, taxaCreditoParcelado, taxaPix, taxaDinheiro
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const body = await request.json();

    const fields = [
      "taxaDebito",
      "taxaCreditoVista",
      "taxaCreditoParcelado",
      "taxaPix",
      "taxaDinheiro",
    ];

    const updates: Record<string, number> = {};
    for (const field of fields) {
      const val = body[field];
      if (val !== undefined) {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) {
          return NextResponse.json(
            { error: `Valor inválido para ${field}.` },
            { status: 400 }
          );
        }
        updates[field] = num;
      }
    }

    await connectDB();

    const config = await Configuracao.findOneAndUpdate(
      { barberId: auth.barberId },
      { $set: updates },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ data: config, message: "Taxas atualizadas com sucesso." });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[PUT /api/barber/configuracoes/taxas]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
