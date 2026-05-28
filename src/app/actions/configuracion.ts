"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import type { ConfiguracionUpdate, Moneda, ResultadoAccion } from "@/lib/types";

const MONEDAS: Moneda[] = ["ARS", "EUR"];

/** Actualiza la configuración global (moneda, zona horaria, franja, precio). */
export async function actualizarConfiguracion(
  input: ConfiguracionUpdate,
): Promise<ResultadoAccion> {
  const cambios: ConfiguracionUpdate = {};

  if (input.moneda_activa !== undefined) {
    if (!MONEDAS.includes(input.moneda_activa)) {
      return { ok: false, error: "Moneda no soportada.", codigo: "DATOS_INVALIDOS" };
    }
    cambios.moneda_activa = input.moneda_activa;
  }

  if (input.zona_horaria !== undefined) {
    const zona = input.zona_horaria.trim();
    if (!esZonaHorariaValida(zona)) {
      return { ok: false, error: "Zona horaria IANA inválida.", codigo: "DATOS_INVALIDOS" };
    }
    cambios.zona_horaria = zona;
  }

  if (input.precio_corte !== undefined) {
    if (!Number.isFinite(input.precio_corte) || input.precio_corte < 0) {
      return { ok: false, error: "Precio inválido.", codigo: "DATOS_INVALIDOS" };
    }
    cambios.precio_corte = input.precio_corte;
  }

  if (input.hora_apertura !== undefined) cambios.hora_apertura = input.hora_apertura;
  if (input.hora_cierre !== undefined) cambios.hora_cierre = input.hora_cierre;
  if (input.duracion_turno_min !== undefined)
    cambios.duracion_turno_min = input.duracion_turno_min;

  if (
    cambios.hora_apertura !== undefined &&
    cambios.hora_cierre !== undefined &&
    cambios.hora_apertura >= cambios.hora_cierre
  ) {
    return {
      ok: false,
      error: "La hora de apertura debe ser anterior a la de cierre.",
      codigo: "DATOS_INVALIDOS",
    };
  }

  const supabase = getAdminClient();
  const { error } = await supabase
    .from("configuracion")
    .update({ ...cambios, actualizado_en: new Date().toISOString() })
    .eq("id", 1);

  if (error) {
    return { ok: false, error: "No se pudo guardar la configuración.", codigo: "ERROR_DESCONOCIDO" };
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/");
  return { ok: true, data: undefined };
}

/** Valida una zona IANA intentando construir un Intl.DateTimeFormat con ella. */
function esZonaHorariaValida(zona: string): boolean {
  if (!zona) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}
