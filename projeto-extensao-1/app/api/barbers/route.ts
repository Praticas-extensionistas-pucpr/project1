import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Barber from "@/lib/models/Barber";

/**
 * GET /api/barbers
 * Retorna todos os barbeiros ativos.
 * Rota pública - não requer autenticação.
 */
export async function GET() {
  try {
    await connectDB();
    // A senha nunca é retornada pois o campo tem select: false no schema
    const barbers = await Barber.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json({ data: barbers }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/barbers]", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar barbeiros." },
      { status: 500 }
    );
  }
}
