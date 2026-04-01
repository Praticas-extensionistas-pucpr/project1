import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Cliente from "@/lib/models/Cliente";

export async function GET(request: NextRequest) {
  try {
    const payload = requireAuth(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200);

    const filter: Record<string, unknown> = {
      barberId: payload.barberId,
      ativo: true,
    };

    if (q) {
      const digits = q.replace(/\D/g, "");
      filter.$or = [
        { nome: { $regex: q, $options: "i" } },
        ...(digits ? [{ telefone: { $regex: digits, $options: "i" } }] : []),
      ];
    }

    const [clientes, total] = await Promise.all([
      Cliente.find(filter).sort({ nome: 1 }).limit(limit).lean(),
      Cliente.countDocuments(filter),
    ]);

    return NextResponse.json({ data: clientes, total });
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
    const { nome, telefone, dataNascimento, observacoes } = body;

    if (!nome?.trim())
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    if (!telefone?.trim())
      return NextResponse.json({ error: "Telefone é obrigatório" }, { status: 400 });

    const cliente = await Cliente.create({
      barberId: payload.barberId,
      nome: nome.trim(),
      telefone: telefone.trim(),
      dataNascimento: dataNascimento || undefined,
      observacoes: observacoes?.trim() || undefined,
    });

    return NextResponse.json({ data: cliente }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
