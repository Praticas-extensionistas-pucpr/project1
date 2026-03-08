import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import Barber from "@/lib/models/Barber";

/**
 * POST /api/barber/register
 * Registra um novo barbeiro no sistema.
 *
 * ⚠️  Esta rota deve ser protegida em produção (desabilitar ou proteger via IP/chave secreta
 *     após criar o primeiro barbeiro). Para maior segurança, use a variável de ambiente
 *     REGISTER_SECRET e envie-a no header X-Register-Secret.
 *
 * Body (JSON):
 *   - name      (string, obrigatório)
 *   - email     (string, obrigatório)
 *   - password  (string, obrigatório - mínimo 6 caracteres)
 *   - phone     (string, obrigatório)
 *   - bio       (string, opcional)
 *   - avatarUrl (string, opcional)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificação opcional de segredo de registro
    const registerSecret = process.env.REGISTER_SECRET;
    if (registerSecret) {
      const providedSecret = request.headers.get("x-register-secret");
      if (providedSecret !== registerSecret) {
        return NextResponse.json(
          { error: "Não autorizado." },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const { name, email, password, phone, bio, avatarUrl } = body;

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios ausentes: name, email, password e phone são obrigatórios.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    await connectDB();

    const existingBarber = await Barber.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingBarber) {
      return NextResponse.json(
        { error: "Já existe um barbeiro cadastrado com este e-mail." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const barber = await Barber.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      bio: bio?.trim() || undefined,
      avatarUrl: avatarUrl?.trim() || undefined,
    });

    return NextResponse.json(
      {
        message: "Barbeiro cadastrado com sucesso.",
        data: {
          _id: barber._id,
          name: barber.name,
          email: barber.email,
          phone: barber.phone,
          bio: barber.bio,
          avatarUrl: barber.avatarUrl,
          isActive: barber.isActive,
          createdAt: barber.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/barber/register]", error);
    return NextResponse.json(
      { error: "Erro interno ao registrar barbeiro." },
      { status: 500 }
    );
  }
}
