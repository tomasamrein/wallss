import { NextResponse, type NextRequest } from "next/server";

/**
 * Gate simple para /admin: exige una cookie cuyo valor coincida con
 * ADMIN_PASSWORD. Suficiente para el MVP; para producción real conviene
 * migrar a Supabase Auth con roles.
 */
export function middleware(req: NextRequest) {
  const cookie = req.cookies.get("wallss_admin")?.value;
  if (cookie && cookie === process.env.ADMIN_PASSWORD) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
