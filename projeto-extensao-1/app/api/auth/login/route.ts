import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import Barber from "@/lib/models/Barber";
import { signToken } from "@/lib/auth";

/**
 * POST /api/auth/login
 * Autentica um barbeiro e retorna um token JWT.
 *
 * Body (JSON):
 *   - email    (string, obrigatório)
 *   - password (string, obrigatório)
 *
 * Resposta de sucesso:
 *   - token   (string) - JWT para ser enviado no header Authorization das próximas requisições
 *   - barber  (object) - dados públicos do barbeiro autenticado
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    await connectDB();

    // Busca o barbeiro incluindo a senha (campo select: false no schema)
    const barber = await Barber.findOne({ email: email.toLowerCase().trim() }).select(
      "+password"
    );

    if (!barber) {
      return NextResponse.json(
        { error: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    if (!barber.isActive) {
      return NextResponse.json(
        { error: "Conta inativa. Entre em contato com o administrador." },
        { status: 403 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, barber.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    const token = signToken({
      barberId: (barber._id as unknown as string).toString(),
      email: barber.email,
      name: barber.name,
    });

    return NextResponse.json(
      {
        message: "Login realizado com sucesso.",
        token,
        barber: {
          _id: barber._id,
          name: barber.name,
          email: barber.email,
          phone: barber.phone,
          bio: barber.bio,
          avatarUrl: barber.avatarUrl,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json(
      { error: "Erro interno ao realizar login." },
      { status: 500 }
    );
  }
}
