import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Produto from "@/lib/models/Produto";

export async function GET(request: NextRequest) {
  try {
    const payload = requireAuth(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get("categoria");
    const q = searchParams.get("q")?.trim();

    const filter: Record<string, unknown> = {
      barberId: payload.barberId,
      ativo: true,
    };

    if (categoria && ["insumo", "venda"].includes(categoria)) {
      filter.categoria = categoria;
    }

    if (q) {
      filter.nome = { $regex: q, $options: "i" };
    }

    const produtos = await Produto.find(filter).sort({ categoria: 1, nome: 1 }).lean();

    return NextResponse.json({ data: produtos });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = requireAuth(request);
    await connectDB();

    const body = await request.json();
    const { nome, categoria, unidade, quantidade, quantidadeMinima, precoCusto, precoVenda } = body;

    if (!nome?.trim())
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    if (!["insumo", "venda"].includes(categoria))
      return NextResponse.json({ error: "Categoria inválida" }, { status: 400 });

    const produto = await Produto.create({
      barberId: payload.barberId,
      nome: nome.trim(),
      categoria,
      unidade: unidade ?? "unidade",
      quantidade: Number(quantidade) || 0,
      quantidadeMinima: Number(quantidadeMinima) ?? 1,
      precoCusto: precoCusto ? Number(precoCusto) : undefined,
      precoVenda: precoVenda ? Number(precoVenda) : undefined,
    });

    return NextResponse.json({ data: produto }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
