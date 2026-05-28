import { NextResponse, type NextRequest } from "next/server";
import { validarTokenSesion } from "@/lib/session";

/**
 * Gate para /admin: exige una cookie de sesión firmada (HMAC) válida y no
 * vencida. La firma usa ADMIN_PASSWORD como secreto.
 */
export async function middleware(req: NextRequest) {
  const secreto = process.env.ADMIN_PASSWORD;
  const token = req.cookies.get("wallss_admin")?.value;

  if (secreto && (await validarTokenSesion(secreto, token))) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
