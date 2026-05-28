"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** Verifica la contraseña y, si es correcta, setea la cookie de sesión admin. */
export async function iniciarSesionAdmin(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const password = String(formData.get("password") ?? "");
  const esperado = process.env.ADMIN_PASSWORD;

  if (!esperado) {
    return { error: "ADMIN_PASSWORD no está configurado en el servidor." };
  }
  if (password !== esperado) {
    return { error: "Contraseña incorrecta." };
  }

  const store = await cookies();
  store.set("wallss_admin", password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });

  redirect("/admin");
}

/** Cierra la sesión admin. */
export async function cerrarSesionAdmin(): Promise<void> {
  const store = await cookies();
  store.delete("wallss_admin");
  redirect("/login");
}
