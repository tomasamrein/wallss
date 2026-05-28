// ============================================================================
//  Utilidades de fecha/zona horaria SIN dependencias externas.
//  Permiten trabajar con la "hora de pared" de la barbería (zona configurable)
//  y convertirla a instantes UTC absolutos (timestamptz).
// ============================================================================

/**
 * Offset (en ms) de una zona horaria respecto de UTC para un instante dado.
 * Positivo al este de UTC (Madrid +1/+2h), negativo al oeste (Buenos Aires -3h).
 */
export function offsetZonaMs(instante: Date, zonaHoraria: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: zonaHoraria,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const partes = dtf.formatToParts(instante);
  const m: Record<string, number> = {};
  for (const p of partes) {
    if (p.type !== "literal") m[p.type] = Number(p.value);
  }
  // La hora 24 que algunos motores emiten para medianoche se normaliza a 0.
  const hora = m.hour === 24 ? 0 : m.hour;

  const comoUTC = Date.UTC(m.year, m.month - 1, m.day, hora, m.minute, m.second);
  return comoUTC - instante.getTime();
}

/**
 * Convierte una hora de pared en una zona horaria a un instante UTC (Date).
 * Ej.: 10:00 en "Europe/Madrid" → el Date apuntando al instante UTC correcto.
 */
export function horaLocalAUtc(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  zonaHoraria: string,
): Date {
  const supuestoUTC = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = offsetZonaMs(new Date(supuestoUTC), zonaHoraria);
  return new Date(supuestoUTC - offset);
}

/** Devuelve la fecha de calendario (Y/M/D) de un instante en una zona horaria. */
export function fechaEnZona(
  instante: Date,
  zonaHoraria: string,
): { year: number; month: number; day: number } {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: zonaHoraria,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = dtf.format(instante).split("-").map(Number);
  return { year, month, day };
}

/** Formatea sólo la hora (HH:mm) de un instante en la zona indicada. */
export function formatearHora(
  iso: string | Date,
  zonaHoraria: string,
  locale = "es-AR",
): string {
  const fecha = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(locale, {
    timeZone: zonaHoraria,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(fecha);
}

/** Formatea fecha + hora completas en la zona indicada. */
export function formatearFechaHora(
  iso: string | Date,
  zonaHoraria: string,
  locale = "es-AR",
): string {
  const fecha = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(locale, {
    timeZone: zonaHoraria,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(fecha);
}

/** Clave "YYYY-MM-DD" de un instante en una zona horaria (para agrupar por día). */
export function claveDia(instante: Date, zonaHoraria: string): string {
  const { year, month, day } = fechaEnZona(instante, zonaHoraria);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
