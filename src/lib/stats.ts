import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import type {
  ClienteResumen,
  Configuracion,
  GananciaMensual,
  Turno,
} from "@/lib/types";

/** Turnos dentro de un rango [desde, hasta) ordenados por inicio. */
export async function obtenerTurnosRango(
  desdeISO: string,
  hastaISO: string,
): Promise<Turno[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("turnos")
    .select("*")
    .gte("fecha_hora_inicio", desdeISO)
    .lt("fecha_hora_inicio", hastaISO)
    .order("fecha_hora_inicio", { ascending: true });

  if (error) throw new Error(`No se pudieron leer los turnos: ${error.message}`);
  return data ?? [];
}

/** ERP simple: agrupa turnos por teléfono con conteo y última visita. */
export async function obtenerResumenClientes(): Promise<ClienteResumen[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("turnos")
    .select("nombre_cliente, telefono_cliente, fecha_hora_inicio")
    .order("fecha_hora_inicio", { ascending: false });

  if (error) throw new Error(`No se pudieron leer los clientes: ${error.message}`);

  const mapa = new Map<string, ClienteResumen>();
  for (const t of data ?? []) {
    const existente = mapa.get(t.telefono_cliente);
    if (existente) {
      existente.total_turnos += 1;
    } else {
      mapa.set(t.telefono_cliente, {
        telefono: t.telefono_cliente,
        nombre: t.nombre_cliente,
        total_turnos: 1,
        ultimo_turno: t.fecha_hora_inicio, // el primero es el más reciente (orden desc)
      });
    }
  }
  return [...mapa.values()].sort((a, b) => b.total_turnos - a.total_turnos);
}

/**
 * Ganancias mensuales del MVP: cantidad de turnos por mes × precio_corte.
 * Como el booking no captura servicios/precios, se usa el precio configurado.
 */
export async function obtenerGananciasMensuales(
  config: Configuracion,
  meses = 6,
): Promise<GananciaMensual[]> {
  const ahora = new Date();
  const desde = new Date(
    Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - (meses - 1), 1),
  );

  const turnos = await obtenerTurnosRango(
    desde.toISOString(),
    new Date(
      Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + 1, 1),
    ).toISOString(),
  );

  const locale = config.moneda_activa === "EUR" ? "es-ES" : "es-AR";
  const fmtMes = new Intl.DateTimeFormat(locale, {
    timeZone: config.zona_horaria,
    month: "short",
    year: "numeric",
  });

  // Inicializa los últimos `meses` en cero para que el gráfico sea continuo.
  const acumulador = new Map<string, GananciaMensual>();
  for (let i = 0; i < meses; i++) {
    const d = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth() + i, 1));
    const mes = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    acumulador.set(mes, {
      mes,
      etiqueta: fmtMes.format(d),
      total_turnos: 0,
      ganancia: 0,
    });
  }

  for (const t of turnos) {
    // Solo los turnos completados generan ingresos (los ausentes no cuentan).
    if (t.estado !== "completado") continue;
    const d = new Date(t.fecha_hora_inicio);
    const mes = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const entrada = acumulador.get(mes);
    if (entrada) {
      entrada.total_turnos += 1;
      entrada.ganancia += config.precio_corte;
    }
  }

  return [...acumulador.values()];
}
