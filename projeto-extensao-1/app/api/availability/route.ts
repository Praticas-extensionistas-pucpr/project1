import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Barber from "@/lib/models/Barber";
import Service from "@/lib/models/Service";
import { getAvailableSlots } from "@/lib/availability";

/**
 * GET /api/availability?barberId=&serviceId=&date=
 * Retorna os horários disponíveis para um barbeiro em uma data específica,
 * considerando a duração do serviço escolhido.
 * Rota pública - não requer autenticação.
 *
 * Query params:
 *   - barberId  (string, obrigatório) - ID do barbeiro
 *   - serviceId (string, obrigatório) - ID do serviço
 *   - date      (string, obrigatório) - Data no formato YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barberId = searchParams.get("barberId");
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date");

    // Validação dos parâmetros obrigatórios
    if (!barberId || !serviceId || !date) {
      return NextResponse.json(
        {
          error:
            "Parâmetros obrigatórios ausentes: barberId, serviceId e date são obrigatórios.",
        },
        { status: 400 }
      );
    }

    // Validação do formato da data
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Formato de data inválido. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    // Verifica se a data não é no passado
    const today = new Date().toISOString().split("T")[0];
    if (date < today) {
      return NextResponse.json(
        { error: "Não é possível consultar disponibilidade para datas passadas." },
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

    const availableSlots = await getAvailableSlots(
      barberId,
      date,
      service.durationMinutes
    );

    return NextResponse.json(
      {
        data: {
          barber: { _id: barber._id, name: barber.name },
          service: {
            _id: service._id,
            name: service.name,
            durationMinutes: service.durationMinutes,
          },
          date,
          availableSlots,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/availability]", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar disponibilidade." },
      { status: 500 }
    );
  }
}
