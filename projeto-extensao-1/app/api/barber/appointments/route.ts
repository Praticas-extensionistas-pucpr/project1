import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/lib/models/Appointment";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/barber/appointments
 * Lista os agendamentos do barbeiro autenticado.
 * Rota protegida - requer token JWT no header Authorization.
 *
 * Query params (todos opcionais):
 *   - date    (string - YYYY-MM-DD) - filtra por data específica
 *   - status  (string) - filtra por status: pending | confirmed | cancelled | completed
 *   - page    (number, default 1)
 *   - limit   (number, default 20)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    await connectDB();

    // Monta o filtro dinâmico
    const filter: Record<string, unknown> = { barberId: auth.barberId };
    if (date) filter.date = date;
    if (status) filter.status = status;

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate("serviceId", "name durationMinutes price")
        .sort({ date: 1, timeSlot: 1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        data: appointments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[GET /api/barber/appointments]", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar agendamentos." },
      { status: 500 }
    );
  }
}
