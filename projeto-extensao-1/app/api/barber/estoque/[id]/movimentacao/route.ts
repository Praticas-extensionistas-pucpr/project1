import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Produto from "@/lib/models/Produto";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(request);
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { tipo, quantidade } = body;

    if (!["entrada", "saida"].includes(tipo))
      return NextResponse.json({ error: "Tipo inválido. Use 'entrada' ou 'saida'" }, { status: 400 });

    const qtd = Number(quantidade);
    if (!qtd || qtd <= 0)
      return NextResponse.json({ error: "Quantidade deve ser maior que zero" }, { status: 400 });

    const produto = await Produto.findOne({ _id: id, barberId: payload.barberId, ativo: true });
    if (!produto)
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

    if (tipo === "saida" && produto.quantidade < qtd)
      return NextResponse.json(
        { error: `Estoque insuficiente. Disponível: ${produto.quantidade}` },
        { status: 400 }
      );

    produto.quantidade = tipo === "entrada"
      ? produto.quantidade + qtd
      : produto.quantidade - qtd;

    await produto.save();

    return NextResponse.json({ data: produto });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
