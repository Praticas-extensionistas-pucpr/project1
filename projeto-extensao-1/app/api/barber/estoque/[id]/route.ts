import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Produto from "@/lib/models/Produto";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(request);
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { nome, categoria, unidade, quantidadeMinima, precoCusto, precoVenda } = body;

    const produto = await Produto.findOne({ _id: id, barberId: payload.barberId });
    if (!produto)
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

    if (nome?.trim()) produto.nome = nome.trim();
    if (categoria && ["insumo", "venda"].includes(categoria)) produto.categoria = categoria;
    if (unidade) produto.unidade = unidade;
    if (quantidadeMinima !== undefined) produto.quantidadeMinima = Number(quantidadeMinima);
    if (precoCusto !== undefined) produto.precoCusto = precoCusto ? Number(precoCusto) : undefined;
    if (precoVenda !== undefined) produto.precoVenda = precoVenda ? Number(precoVenda) : undefined;

    await produto.save();

    return NextResponse.json({ data: produto });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(request);
    await connectDB();

    const { id } = await params;

    const produto = await Produto.findOne({ _id: id, barberId: payload.barberId });
    if (!produto)
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

    produto.ativo = false;
    await produto.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
