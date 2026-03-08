import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import Barber from "@/lib/models/Barber";
import Service from "@/lib/models/Service";

/**
 * POST /api/seed
 * Popula o banco de dados com dados iniciais de exemplo.
 *
 * ⚠️  ATENÇÃO: Esta rota é apenas para desenvolvimento/configuração inicial.
 *     Remova ou proteja esta rota antes de ir para produção.
 *
 * Body (JSON):
 *   - secret (string) - deve ser igual à variável SEED_SECRET no .env.local
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Rota de seed não disponível em produção." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const seedSecret = process.env.SEED_SECRET;

    if (seedSecret && body.secret !== seedSecret) {
      return NextResponse.json(
        { error: "Segredo de seed inválido." },
        { status: 401 }
      );
    }

    await connectDB();

    // --- Serviços ---
    const services = [
      {
        name: "Corte Simples",
        description: "Corte tradicional na tesoura ou máquina.",
        durationMinutes: 30,
        price: 35,
      },
      {
        name: "Corte + Barba",
        description: "Corte completo com aparação e desenho da barba.",
        durationMinutes: 60,
        price: 60,
      },
      {
        name: "Barba Completa",
        description: "Aparação, hidratação e modelagem da barba.",
        durationMinutes: 45,
        price: 40,
      },
      {
        name: "Corte Degradê",
        description: "Fade clássico com acabamento perfeito.",
        durationMinutes: 45,
        price: 50,
      },
      {
        name: "Sobrancelha",
        description: "Desenho e definição das sobrancelhas.",
        durationMinutes: 15,
        price: 15,
      },
      {
        name: "Pacote Completo",
        description: "Corte degradê + barba completa + sobrancelha.",
        durationMinutes: 90,
        price: 90,
      },
    ];

    const createdServices = [];
    for (const svc of services) {
      const existing = await Service.findOne({ name: svc.name });
      if (!existing) {
        createdServices.push(await Service.create(svc));
      }
    }

    // --- Barbeiro demo ---
    const demoBarber = {
      name: "João da Navalha",
      email: "joao@barbearia.com",
      password: await bcrypt.hash("senha123", 10),
      phone: "(11) 99999-0001",
      bio: "Barbeiro há 10 anos. Especialista em degradê e barba.",
    };

    let barber = await Barber.findOne({ email: demoBarber.email });
    if (!barber) {
      barber = await Barber.create(demoBarber);
    }

    return NextResponse.json(
      {
        message: "Seed executado com sucesso!",
        data: {
          servicesCreated: createdServices.length,
          barberCreated: !barber ? 1 : 0,
          demoCredentials: {
            email: demoBarber.email,
            password: "senha123",
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/seed]", error);
    return NextResponse.json(
      { error: "Erro ao executar seed." },
      { status: 500 }
    );
  }
}
