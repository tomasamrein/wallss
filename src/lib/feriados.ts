import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import type { Feriado } from "@/lib/types";

/** Lista todos los feriados/cierres puntuales ordenados por fecha. */
export async function obtenerFeriados(): Promise<Feriado[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("feriados")
    .select("*")
    .order("fecha", { ascending: true });
  if (error) throw new Error(`No se pudieron leer los feriados: ${error.message}`);
  return data ?? [];
}

/** Set de fechas (YYYY-MM-DD) cerradas por feriado, para chequeos rápidos. */
export async function obtenerSetFeriados(): Promise<Set<string>> {
  const feriados = await obtenerFeriados();
  return new Set(feriados.map((f) => f.fecha));
}
