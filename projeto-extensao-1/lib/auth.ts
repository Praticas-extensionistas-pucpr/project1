import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "8h") as string;

if (!JWT_SECRET) {
  throw new Error(
    "Por favor, defina a variável de ambiente JWT_SECRET no arquivo .env.local"
  );
}

export interface JwtPayload {
  barberId: string;
  email: string;
  name: string;
}

/**
 * Gera um token JWT com os dados do barbeiro.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

/**
 * Verifica e decodifica um token JWT.
 * Lança erro se o token for inválido ou expirado.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * Extrai e valida o token JWT do header Authorization de uma requisição Next.js.
 * Retorna o payload decodificado ou null se inválido/ausente.
 */
export function getAuthPayload(request: NextRequest): JwtPayload | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.split(" ")[1];
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Middleware helper: retorna o payload autenticado ou lança uma Response 401.
 */
export function requireAuth(request: NextRequest): JwtPayload {
  const payload = getAuthPayload(request);
  if (!payload) {
    throw new Response(
      JSON.stringify({ error: "Não autorizado. Token inválido ou ausente." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  return payload;
}
