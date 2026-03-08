import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import Barber from "@/lib/models/Barber";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/barber/profile
 * Retorna os dados do perfil do barbeiro autenticado.
 * Rota protegida - requer token JWT no header Authorization.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);

    await connectDB();

    const barber = await Barber.findById(auth.barberId);
    if (!barber) {
      return NextResponse.json(
        { error: "Barbeiro não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: barber }, { status: 200 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[GET /api/barber/profile]", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar perfil." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/barber/profile
 * Atualiza os dados do perfil do barbeiro autenticado.
 * Rota protegida - requer token JWT no header Authorization.
 *
 * Body (JSON) — todos opcionais:
 *   - name       (string)
 *   - phone      (string)
 *   - bio        (string)
 *   - avatarUrl  (string)
 *   - password   (string) - nova senha (mínimo 6 caracteres)
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.name?.trim()) updates.name = body.name.trim();
    if (body.phone?.trim()) updates.phone = body.phone.trim();
    if (body.bio !== undefined) updates.bio = body.bio?.trim() || undefined;
    if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl?.trim() || undefined;

    if (body.password) {
      if (body.password.length < 6) {
        return NextResponse.json(
          { error: "A nova senha deve ter no mínimo 6 caracteres." },
          { status: 400 }
        );
      }
      updates.password = await bcrypt.hash(body.password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo válido para atualizar foi fornecido." },
        { status: 400 }
      );
    }

    await connectDB();

    const barber = await Barber.findByIdAndUpdate(auth.barberId, updates, {
      new: true,
      runValidators: true,
    });

    if (!barber) {
      return NextResponse.json(
        { error: "Barbeiro não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Perfil atualizado com sucesso.", data: barber },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[PUT /api/barber/profile]", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar perfil." },
      { status: 500 }
    );
  }
}
