import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/lib/models/Appointment";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/barber/appointments
 * Query params (todos opcionais):
 *   - date          (YYYY-MM-DD) — filtra por data exata
 *   - startDate     (YYYY-MM-DD) — início do intervalo (usa junto com endDate)
 *   - endDate       (YYYY-MM-DD) — fim do intervalo
 *   - status        — pending | confirmed | cancelled | completed
 *   - search        — busca parcial por nome do cliente (case-insensitive)
 *   - createdAfter  (ISO string) — retorna apenas agendamentos criados após essa data
 *   - page          (default 1)
 *   - limit         (default 20, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date") ?? undefined;
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const createdAfter = searchParams.get("createdAfter") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    await connectDB();

    const filter: Record<string, unknown> = { barberId: auth.barberId };

    if (date) {
      filter.date = date;
    } else if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (status) filter.status = status;

    if (search?.trim()) {
      filter.clientName = { $regex: search.trim(), $options: "i" };
    }

    if (createdAfter) {
      filter.createdAt = { $gt: new Date(createdAfter) };
    }

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
