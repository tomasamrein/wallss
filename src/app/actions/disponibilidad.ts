"use server";

import { obtenerConfiguracion } from "@/lib/config";
import { obtenerSetFeriados } from "@/lib/feriados";
import { getAdminClient } from "@/lib/supabase/admin";
import { calcularSlotsDisponibles, esDiaCerrado } from "@/lib/availability";
import { horaLocalAUtc } from "@/lib/datetime";

/**
 * Devuelve los horarios disponibles de un día puntual (para carga on-demand
 * desde el panel público, sin recargar toda la página).
 */
export async function slotsDeDia(
  fechaISO: string,
): Promise<{ slots: string[]; cerrado: boolean }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) {
    return { slots: [], cerrado: false };
  }

  const [config, feriados] = await Promise.all([
    obtenerConfiguracion(),
    obtenerSetFeriados(),
  ]);

  if (esDiaCerrado(fechaISO, config, feriados)) {
    return { slots: [], cerrado: true };
  }

  const [year, month, day] = fechaISO.split("-").map(Number);
  const inicioDia = horaLocalAUtc(year, month, day, 0, 0, config.zona_horaria);
  const finDia = horaLocalAUtc(year, month, day + 1, 0, 0, config.zona_horaria);

  const supabase = getAdminClient();
  const { data: ocupados } = await supabase
    .from("turnos")
    .select("fecha_hora_inicio")
    .gte("fecha_hora_inicio", inicioDia.toISOString())
    .lt("fecha_hora_inicio", finDia.toISOString());

  const slots = calcularSlotsDisponibles({
    fechaISO,
    config,
    turnosOcupadosISO: (ocupados ?? []).map((t) => t.fecha_hora_inicio),
    feriados,
  }).map((s) => s.toISOString());

  return { slots, cerrado: false };
}
