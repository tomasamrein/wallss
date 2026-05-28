"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { obtenerConfiguracion } from "@/lib/config";
import {
  enviarNotificacionWhatsApp,
  construirMensajeBarbero,
} from "@/lib/whatsapp";
import type { EstadoTurno, ResultadoAccion, Turno } from "@/lib/types";

const ANTELACION_MS = 60 * 60_000;
const ESTADOS_VALIDOS: EstadoTurno[] = ["pendiente", "completado", "ausente"];

/**
 * Crea un turno desde el panel público.
 *
 * Validaciones en capas:
 *   1. Datos básicos en el servidor (nombre/teléfono/fecha).
 *   2. Antelación >= 1 h verificada también aquí (la BD la garantiza igual).
 *   3. La BD aplica el trigger de antelación y la exclusión anti-solapamiento.
 *
 * Tras la inserción exitosa dispara, SIN bloquear la respuesta, la
 * notificación de WhatsApp al barbero.
 */
export async function crearTurno(input: {
  nombre_cliente: string;
  telefono_cliente: string;
  fecha_hora_inicio: string;
}): Promise<ResultadoAccion<Turno>> {
  const nombre = input.nombre_cliente?.trim();
  const telefono = input.telefono_cliente?.trim();
  const inicio = input.fecha_hora_inicio;

  if (!nombre || !telefono || !inicio) {
    return { ok: false, error: "Faltan datos obligatorios.", codigo: "DATOS_INVALIDOS" };
  }

  const fecha = new Date(inicio);
  if (Number.isNaN(fecha.getTime())) {
    return { ok: false, error: "La fecha del turno no es válida.", codigo: "DATOS_INVALIDOS" };
  }

  if (fecha.getTime() <= Date.now() + ANTELACION_MS) {
    return {
      ok: false,
      error: "El turno debe reservarse con al menos 1 hora de antelación.",
      codigo: "ANTELACION_INSUFICIENTE",
    };
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("turnos")
    .insert({
      nombre_cliente: nombre,
      telefono_cliente: telefono,
      fecha_hora_inicio: fecha.toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    // 23P01 = exclusion_violation (solapamiento). 23505 = unique_violation.
    if (error?.code === "23P01" || error?.code === "23505") {
      return {
        ok: false,
        error: "Ese horario ya fue reservado. Elegí otro, por favor.",
        codigo: "SLOT_OCUPADO",
      };
    }
    if (error?.message?.includes("ANTELACION_INSUFICIENTE")) {
      return {
        ok: false,
        error: "El turno debe reservarse con al menos 1 hora de antelación.",
        codigo: "ANTELACION_INSUFICIENTE",
      };
    }
    return {
      ok: false,
      error: "No se pudo registrar el turno. Intentá de nuevo.",
      codigo: "ERROR_DESCONOCIDO",
    };
  }

  // `after` ejecuta la notificación TRAS enviar la respuesta al frontend:
  // el cliente recibe la confirmación al instante y WhatsApp se dispara aparte.
  after(async () => {
    try {
      await dispararNotificacionBarbero(data);
    } catch (e) {
      console.error("[turnos] Falló la notificación al barbero:", e);
    }
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, data };
}

/**
 * Marca el estado de un turno desde el panel admin.
 * Solo los turnos 'completado' suman a las ganancias.
 */
export async function actualizarEstadoTurno(
  id: string,
  estado: EstadoTurno,
): Promise<ResultadoAccion> {
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return { ok: false, error: "Estado inválido.", codigo: "DATOS_INVALIDOS" };
  }

  const supabase = getAdminClient();
  const { error } = await supabase.from("turnos").update({ estado }).eq("id", id);

  if (error) {
    return { ok: false, error: "No se pudo actualizar el turno.", codigo: "ERROR_DESCONOCIDO" };
  }

  revalidatePath("/admin");
  return { ok: true, data: undefined };
}

/** Notifica al barbero por WhatsApp. Se ejecuta fuera del camino crítico. */
async function dispararNotificacionBarbero(turno: Turno): Promise<void> {
  const barbero = process.env.BARBERO_TELEFONO;
  if (!barbero) {
    console.warn("[turnos] BARBERO_TELEFONO no configurado; no se notifica.");
    return;
  }
  const config = await obtenerConfiguracion();
  const mensaje = construirMensajeBarbero(turno, config);
  await enviarNotificacionWhatsApp(barbero, mensaje);
}
