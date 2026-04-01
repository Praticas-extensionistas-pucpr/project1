import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Cliente from "@/lib/models/Cliente";
import AtendimentoCliente from "@/lib/models/AtendimentoCliente";

type Params = { params: Promise<{ id: string }> };

function invalidId() {
  return NextResponse.json({ error: "ID inválido" }, { status: 400 });
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payload = requireAuth(request);
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return invalidId();
    await connectDB();

    const cliente = await Cliente.findOne({
      _id: id,
      barberId: payload.barberId,
    }).lean();
    if (!cliente)
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

    const historico = await AtendimentoCliente.find({
      clienteId: id,
      barberId: payload.barberId,
    })
      .sort({ data: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ data: { ...cliente, historico } });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = requireAuth(request);
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return invalidId();
    await connectDB();

    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (body.nome !== undefined) update.nome = body.nome.trim();
    if (body.telefone !== undefined) update.telefone = body.telefone.trim();
    if (body.dataNascimento !== undefined)
      update.dataNascimento = body.dataNascimento || null;
    if (body.observacoes !== undefined)
      update.observacoes = body.observacoes.trim();

    const cliente = await Cliente.findOneAndUpdate(
      { _id: id, barberId: payload.barberId },
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!cliente)
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

    return NextResponse.json({ data: cliente });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = requireAuth(request);
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return invalidId();
    await connectDB();

    await Cliente.findOneAndUpdate(
      { _id: id, barberId: payload.barberId },
      { $set: { ativo: false } }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
