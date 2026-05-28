import { NextResponse, type NextRequest } from "next/server";

/**
 * Login del panel admin. Verifica la contraseña y setea la cookie de sesión.
 * Se hace en un Route Handler (no en un Server Action) porque garantiza el
 * contexto de request para escribir cookies en la respuesta.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  const esperado = process.env.ADMIN_PASSWORD;

  const url = req.nextUrl.clone();

  if (!esperado || password !== esperado) {
    url.pathname = "/login";
    url.search = "?error=1";
    return NextResponse.redirect(url, { status: 303 });
  }

  url.pathname = "/admin";
  url.search = "";
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set("wallss_admin", password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
  return res;
}
