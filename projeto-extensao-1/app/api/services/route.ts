import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Service from "@/lib/models/Service";

/**
 * GET /api/services
 * Retorna todos os serviços ativos da barbearia.
 * Rota pública - não requer autenticação.
 */
export async function GET() {
  try {
    await connectDB();
    const services = await Service.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json({ data: services }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/services]", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar serviços." },
      { status: 500 }
    );
  }
}
