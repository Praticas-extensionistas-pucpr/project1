import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Service from "@/lib/models/Service";
import { requireAuth } from "@/lib/auth";

/**
 * PUT /api/barber/services/[id]
 * Atualiza um serviço existente.
 * Rota protegida - requer token JWT no header Authorization.
 *
 * Body (JSON) — todos opcionais, apenas os campos enviados serão atualizados:
 *   - name              (string)
 *   - description       (string)
 *   - durationMinutes   (number)
 *   - price             (number)
 *   - isActive          (boolean)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description.trim();
    if (body.durationMinutes !== undefined) updates.durationMinutes = Number(body.durationMinutes);
    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo válido para atualizar foi fornecido." },
        { status: 400 }
      );
    }

    await connectDB();

    const service = await Service.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      return NextResponse.json(
        { error: "Serviço não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Serviço atualizado com sucesso.", data: service },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[PUT /api/barber/services/[id]]", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar serviço." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/barber/services/[id]
 * Desativa (soft delete) um serviço.
 * O serviço não é removido fisicamente para preservar o histórico dos agendamentos.
 * Rota protegida - requer token JWT no header Authorization.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request);
    const { id } = await params;

    await connectDB();

    const service = await Service.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!service) {
      return NextResponse.json(
        { error: "Serviço não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Serviço desativado com sucesso.", data: service },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[DELETE /api/barber/services/[id]]", error);
    return NextResponse.json(
      { error: "Erro interno ao desativar serviço." },
      { status: 500 }
    );
  }
}
