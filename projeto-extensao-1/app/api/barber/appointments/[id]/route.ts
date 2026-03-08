import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment, { AppointmentStatus } from "@/lib/models/Appointment";
import { requireAuth } from "@/lib/auth";

const VALID_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

/**
 * GET /api/barber/appointments/[id]
 * Retorna os detalhes de um agendamento específico do barbeiro autenticado.
 * Rota protegida - requer token JWT no header Authorization.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    const { id } = await params;

    await connectDB();

    const appointment = await Appointment.findOne({
      _id: id,
      barberId: auth.barberId,
    })
      .populate("serviceId", "name durationMinutes price description")
      .populate("barberId", "name phone");

    if (!appointment) {
      return NextResponse.json(
        { error: "Agendamento não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: appointment }, { status: 200 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[GET /api/barber/appointments/[id]]", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar agendamento." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/barber/appointments/[id]
 * Atualiza o status de um agendamento.
 * Rota protegida - requer token JWT no header Authorization.
 *
 * Body (JSON):
 *   - status        (string, obrigatório) - novo status: confirmed | cancelled | completed
 *   - cancelReason  (string, obrigatório quando status = "cancelled")
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { status, cancelReason } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Campo 'status' é obrigatório." },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Status inválido. Valores aceitos: ${VALID_STATUSES.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    if (status === "cancelled" && !cancelReason?.trim()) {
      return NextResponse.json(
        { error: "O motivo do cancelamento é obrigatório." },
        { status: 400 }
      );
    }

    await connectDB();

    const appointment = await Appointment.findOne({
      _id: id,
      barberId: auth.barberId,
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Agendamento não encontrado." },
        { status: 404 }
      );
    }

    // Regras de transição de status
    if (appointment.status === "completed" || appointment.status === "cancelled") {
      return NextResponse.json(
        {
          error: `Não é possível alterar um agendamento com status '${appointment.status}'.`,
        },
        { status: 400 }
      );
    }

    appointment.status = status;
    if (status === "cancelled") {
      appointment.cancelReason = cancelReason.trim();
    }

    await appointment.save();
    await appointment.populate([
      { path: "serviceId", select: "name durationMinutes price" },
    ]);

    return NextResponse.json(
      {
        message: "Agendamento atualizado com sucesso.",
        data: appointment,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[PATCH /api/barber/appointments/[id]]", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar agendamento." },
      { status: 500 }
    );
  }
}
