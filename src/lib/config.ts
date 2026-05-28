import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import type { Configuracion } from "@/lib/types";

/** Lee la fila única de configuración global (id = 1). */
export async function obtenerConfiguracion(): Promise<Configuracion> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("configuracion")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    throw new Error(
      `No se pudo cargar la configuración: ${error?.message ?? "fila ausente"}`,
    );
  }
  return data;
}
