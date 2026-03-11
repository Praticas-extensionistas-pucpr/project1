import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Exceção: página de login do cliente — evita loop de redirecionamento
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return NextResponse.next();
  }

  // Proteção da rota raiz: exige cookie de cliente (token ou user-token)
  if (pathname === "/") {
    const clientToken =
      request.cookies.get("user-token")?.value ?? request.cookies.get("token")?.value;
    if (!clientToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Proteção das rotas /barber (exceto /barber/login)
  if (pathname.startsWith("/barber")) {
    if (pathname === "/barber/login" || pathname.startsWith("/barber/login/")) {
      return NextResponse.next();
    }
    const barberToken = request.cookies.get("barber-token")?.value;
    if (!barberToken) {
      return NextResponse.redirect(new URL("/barber/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/login/:path*", "/barber", "/barber/:path*"],
};
