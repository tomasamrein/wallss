// ============================================================================
//  Lógica de disponibilidad de turnos (pura, testeable, sin I/O).
// ============================================================================
import type { Configuracion } from "@/lib/types";
import { horaLocalAUtc } from "@/lib/datetime";

/** Antelación mínima de reserva, en minutos. Coincide con la regla de negocio. */
export const ANTELACION_MINIMA_MIN = 60;

/**
 * ENTREGABLE 4 · Filtra horarios demasiado próximos a la hora actual.
 *
 * Recibe un array de horarios (Date o strings ISO) y devuelve un NUEVO array
 * eliminando cualquier horario que esté a menos de `minutos` (por defecto 60)
 * del momento actual del cliente.
 *
 * @param horarios  Slots candidatos (ISO string o Date).
 * @param ahora     Instante de referencia (inyectable para tests). Default: now.
 * @param minutos   Margen mínimo requerido. Default: 60.
 */
export function filtrarPorAntelacion(
  horarios: Array<string | Date>,
  ahora: Date = new Date(),
  minutos: number = ANTELACION_MINIMA_MIN,
): Date[] {
  const limite = ahora.getTime() + minutos * 60_000;

  return horarios
    .map((h) => (typeof h === "string" ? new Date(h) : h))
    .filter((d) => !Number.isNaN(d.getTime()) && d.getTime() >= limite);
}

/**
 * Genera todos los slots de un día (en la zona horaria de la barbería) como
 * instantes UTC, según la franja horaria y la duración configuradas.
 *
 * @param fechaISO  Día objetivo en formato "YYYY-MM-DD" (hora de pared local).
 * @param config    Configuración global (franja horaria + duración).
 */
export function generarSlotsDelDia(
  fechaISO: string,
  config: Pick<
    Configuracion,
    "zona_horaria" | "hora_apertura" | "hora_cierre" | "duracion_turno_min"
  >,
): Date[] {
  const [year, month, day] = fechaISO.split("-").map(Number);
  const slots: Date[] = [];

  const inicioMin = config.hora_apertura * 60;
  const finMin = config.hora_cierre * 60;
  const paso = config.duracion_turno_min;

  for (let minuto = inicioMin; minuto + paso <= finMin; minuto += paso) {
    const hora = Math.floor(minuto / 60);
    const min = minuto % 60;
    slots.push(horaLocalAUtc(year, month, day, hora, min, config.zona_horaria));
  }

  return slots;
}

/**
 * Quita de la lista de slots los que ya están ocupados por un turno existente.
 * La comparación es por instante absoluto (timestamp en ms).
 *
 * @param slots          Slots candidatos (instantes UTC).
 * @param ocupadosISO    Inicios de turnos ya reservados (ISO 8601).
 */
export function filtrarSlotsOcupados(
  slots: Date[],
  ocupadosISO: string[],
): Date[] {
  const ocupados = new Set(ocupadosISO.map((iso) => new Date(iso).getTime()));
  return slots.filter((s) => !ocupados.has(s.getTime()));
}

/**
 * Pipeline completo de disponibilidad para el panel público:
 *   grilla del día → quitar ocupados → quitar los de antelación insuficiente.
 * Devuelve instantes UTC listos para renderizar.
 */
export function calcularSlotsDisponibles(params: {
  fechaISO: string;
  config: Configuracion;
  turnosOcupadosISO: string[];
  ahora?: Date;
}): Date[] {
  const { fechaISO, config, turnosOcupadosISO, ahora } = params;
  const grilla = generarSlotsDelDia(fechaISO, config);
  const libres = filtrarSlotsOcupados(grilla, turnosOcupadosISO);
  return filtrarPorAntelacion(libres, ahora);
}
