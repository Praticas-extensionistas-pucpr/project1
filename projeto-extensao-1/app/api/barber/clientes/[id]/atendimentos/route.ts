import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Cliente from "@/lib/models/Cliente";
import AtendimentoCliente from "@/lib/models/AtendimentoCliente";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const payload = requireAuth(request);
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    await connectDB();

    const body = await request.json();
    const { servico, preco, observacoes, data } = body;

    if (!servico?.trim())
      return NextResponse.json({ error: "Serviço é obrigatório" }, { status: 400 });
    if (typeof preco !== "number" || preco < 0)
      return NextResponse.json({ error: "Preço inválido" }, { status: 400 });

    const cliente = await Cliente.findOne({
      _id: id,
      barberId: payload.barberId,
    });
    if (!cliente)
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

    const dataAtendimento = data ? new Date(data) : new Date();

    const atendimento = await AtendimentoCliente.create({
      clienteId: id,
      barberId: payload.barberId,
      servico: servico.trim(),
      preco,
      observacoes: observacoes?.trim() || undefined,
      data: dataAtendimento,
    });

    // Atualiza estatísticas do cliente
    const favs = cliente.servicosFavoritos ?? [];
    if (!favs.includes(servico.trim())) {
      favs.push(servico.trim());
    }

    await Cliente.findByIdAndUpdate(id, {
      $set: {
        ultimoCorte: dataAtendimento,
        servicosFavoritos: favs.slice(-10),
      },
      $inc: { totalServicos: 1 },
    });

    return NextResponse.json({ data: atendimento }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
