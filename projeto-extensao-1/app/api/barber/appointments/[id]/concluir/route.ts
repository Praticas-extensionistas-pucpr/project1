import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/lib/models/Appointment";
import Transacao from "@/lib/models/Transacao";
import Configuracao from "@/lib/models/Configuracao";
import { requireAuth } from "@/lib/auth";

/**
 * POST /api/barber/appointments/[id]/concluir
 * Conclui um agendamento e registra a transação financeira.
 *
 * Body:
 *   - valorCobrado   (number, obrigatório) — valor real cobrado do cliente
 *   - formaPagamento (string, obrigatório) — dinheiro | pix | debito | credito_vista
 *   - observacao     (string, opcional)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    const { valorCobrado, formaPagamento, observacao } = body;

    if (!valorCobrado || typeof valorCobrado !== "number" || valorCobrado <= 0) {
      return NextResponse.json({ error: "Valor cobrado inválido." }, { status: 400 });
    }

    const formasValidas = ["dinheiro", "pix", "debito", "credito_vista"];
    if (!formasValidas.includes(formaPagamento)) {
      return NextResponse.json({ error: "Forma de pagamento inválida." }, { status: 400 });
    }

    await connectDB();

    const appointment = await Appointment.findOne({
      _id: id,
      barberId: auth.barberId,
    }).populate("serviceId", "name");

    if (!appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }

    if (appointment.status === "completed" || appointment.status === "cancelled") {
      return NextResponse.json(
        { error: `Agendamento já está com status '${appointment.status}'.` },
        { status: 400 }
      );
    }

    const config = await Configuracao.findOne({ barberId: auth.barberId });
    const taxaMap: Record<string, number> = {
      dinheiro: config?.taxaDinheiro ?? 0,
      pix: config?.taxaPix ?? 0,
      debito: config?.taxaDebito ?? 1.99,
      credito_vista: config?.taxaCreditoVista ?? 2.99,
    };
    const taxaPercentual = taxaMap[formaPagamento] ?? 0;
    const valorTaxa = parseFloat(((valorCobrado * taxaPercentual) / 100).toFixed(2));
    const valorLiquido = parseFloat((valorCobrado - valorTaxa).toFixed(2));

    const svcPopulated = appointment.serviceId as unknown as { name: string } | null;
    const descricao = observacao?.trim() || (svcPopulated?.name ?? "Serviço");

    await Transacao.create({
      barberId: auth.barberId,
      agendamentoId: appointment._id,
      tipo: "servico",
      descricao,
      valorBruto: valorCobrado,
      formaPagamento,
      taxaPercentual,
      valorTaxa,
      valorLiquido,
      categoria: "corte",
    });

    appointment.status = "completed";
    await appointment.save();

    return NextResponse.json({
      message: "Agendamento concluído com sucesso.",
      valorLiquido,
      valorTaxa,
      taxaPercentual,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[POST /api/barber/appointments/[id]/concluir]", error);
    return NextResponse.json(
      { error: "Erro interno ao concluir agendamento." },
      { status: 500 }
    );
  }
}
