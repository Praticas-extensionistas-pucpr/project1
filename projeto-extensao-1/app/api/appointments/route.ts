import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Barber from "@/lib/models/Barber";
import Service from "@/lib/models/Service";
import Appointment from "@/lib/models/Appointment";
import { getAvailableSlots, calcEndTime } from "@/lib/availability";

/**
 * POST /api/appointments
 * Cria um novo agendamento de serviço.
 * Rota pública - não requer autenticação (o cliente não precisa de login).
 *
 * Body (JSON):
 *   - clientName    (string, obrigatório)
 *   - clientPhone   (string, obrigatório)
 *   - clientEmail   (string, opcional)
 *   - clientNotes   (string, opcional)
 *   - barberId      (string, obrigatório)
 *   - serviceId     (string, obrigatório)
 *   - date          (string, obrigatório - formato YYYY-MM-DD)
 *   - timeSlot      (string, obrigatório - formato HH:MM)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientName,
      clientPhone,
      clientEmail,
      clientNotes,
      barberId,
      serviceId,
      date,
      timeSlot,
    } = body;

    // Validação dos campos obrigatórios
    if (!clientName || !clientPhone || !barberId || !serviceId || !date || !timeSlot) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios ausentes: clientName, clientPhone, barberId, serviceId, date e timeSlot.",
        },
        { status: 400 }
      );
    }

    // Validação de formatos
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Formato de data inválido. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    if (!/^\d{2}:\d{2}$/.test(timeSlot)) {
      return NextResponse.json(
        { error: "Formato de horário inválido. Use HH:MM." },
        { status: 400 }
      );
    }

    // Verifica se a data/horário não é no passado
    const now = new Date();
    const appointmentDateTime = new Date(`${date}T${timeSlot}:00`);
    if (appointmentDateTime <= now) {
      return NextResponse.json(
        { error: "Não é possível agendar para uma data/horário no passado." },
        { status: 400 }
      );
    }

    await connectDB();

    // Verifica existência do barbeiro e do serviço
    const [barber, service] = await Promise.all([
      Barber.findOne({ _id: barberId, isActive: true }),
      Service.findOne({ _id: serviceId, isActive: true }),
    ]);

    if (!barber) {
      return NextResponse.json(
        { error: "Barbeiro não encontrado ou inativo." },
        { status: 404 }
      );
    }

    if (!service) {
      return NextResponse.json(
        { error: "Serviço não encontrado ou inativo." },
        { status: 404 }
      );
    }

    // Re-valida disponibilidade no momento da criação
    const availableSlots = await getAvailableSlots(
      barberId,
      date,
      service.durationMinutes
    );

    if (!availableSlots.includes(timeSlot)) {
      return NextResponse.json(
        {
          error:
            "Horário indisponível. Por favor, escolha outro horário ou data.",
        },
        { status: 409 }
      );
    }

    const endTime = calcEndTime(timeSlot, service.durationMinutes);

    const appointment = await Appointment.create({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail?.trim() || undefined,
      clientNotes: clientNotes?.trim() || undefined,
      barberId,
      serviceId,
      date,
      timeSlot,
      endTime,
      status: "pending",
    });

    // Popula os dados do barbeiro e serviço para a resposta
    await appointment.populate([
      { path: "barberId", select: "name phone" },
      { path: "serviceId", select: "name durationMinutes price" },
    ]);

    return NextResponse.json(
      {
        message: "Agendamento criado com sucesso!",
        data: appointment,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        {
          error:
            "Horário já foi reservado por outro cliente. Por favor, escolha outro horário.",
        },
        { status: 409 }
      );
    }
    console.error("[POST /api/appointments]", error);
    return NextResponse.json(
      { error: "Erro interno ao criar agendamento." },
      { status: 500 }
    );
  }
}
