import { NextResponse, type NextRequest } from "next/server";
import { crearTokenSesion } from "@/lib/session";

const TTL_CORTO_MS = 60 * 60 * 8 * 1000; // 8 horas (sesión normal)
const TTL_LARGO_MS = 60 * 60 * 24 * 30 * 1000; // 30 días ("recordar")

// Throttle de fuerza bruta en memoria (best-effort en serverless).
const MAX_INTENTOS = 5;
const VENTANA_MS = 5 * 60 * 1000;
const intentos = new Map<string, { count: number; resetAt: number }>();

function permitido(ip: string): boolean {
  const ahora = Date.now();
  const reg = intentos.get(ip);
  if (!reg || ahora > reg.resetAt) {
    intentos.set(ip, { count: 1, resetAt: ahora + VENTANA_MS });
    return true;
  }
  reg.count += 1;
  return reg.count <= MAX_INTENTOS;
}

/**
 * Login del panel admin: valida la contraseña, aplica throttle y setea una
 * cookie de sesión FIRMADA (no guarda la contraseña en texto plano).
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida";
  const url = req.nextUrl.clone();

  if (!permitido(ip)) {
    url.pathname = "/login";
    url.search = "?error=throttle";
    return NextResponse.redirect(url, { status: 303 });
  }

  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  const esperado = process.env.ADMIN_PASSWORD;

  if (!esperado || password !== esperado) {
    url.pathname = "/login";
    url.search = "?error=1";
    return NextResponse.redirect(url, { status: 303 });
  }

  // Login OK: limpiar el contador de intentos de esa IP.
  intentos.delete(ip);

  // "Recordar en este dispositivo" → sesión larga (30 días) en vez de 8 hs.
  const recordar = form.get("recordar") === "on";
  const ttl = recordar ? TTL_LARGO_MS : TTL_CORTO_MS;

  url.pathname = "/admin";
  url.search = "";
  const token = await crearTokenSesion(esperado, ttl);
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set("wallss_admin", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ttl / 1000,
  });
  return res;
}
