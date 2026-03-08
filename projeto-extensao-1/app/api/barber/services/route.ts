import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Service from "@/lib/models/Service";
import { requireAuth } from "@/lib/auth";

/**
 * POST /api/barber/services
 * Cria um novo serviço na barbearia.
 * Rota protegida - requer token JWT no header Authorization.
 *
 * Body (JSON):
 *   - name              (string, obrigatório)
 *   - description       (string, opcional)
 *   - durationMinutes   (number, obrigatório) - duração em minutos
 *   - price             (number, obrigatório) - preço em reais
 */
export async function POST(request: NextRequest) {
  try {
    requireAuth(request);
    const body = await request.json();

    const { name, description, durationMinutes, price } = body;

    if (!name || durationMinutes === undefined || price === undefined) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios ausentes: name, durationMinutes e price são obrigatórios.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const service = await Service.create({
      name: name.trim(),
      description: description?.trim() || undefined,
      durationMinutes: Number(durationMinutes),
      price: Number(price),
    });

    return NextResponse.json(
      { message: "Serviço criado com sucesso.", data: service },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[POST /api/barber/services]", error);
    return NextResponse.json(
      { error: "Erro interno ao criar serviço." },
      { status: 500 }
    );
  }
}
