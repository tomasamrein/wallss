import { NextResponse, type NextRequest } from "next/server";

/** Cierra la sesión admin borrando la cookie. */
export async function POST(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.delete("wallss_admin");
  return res;
}
