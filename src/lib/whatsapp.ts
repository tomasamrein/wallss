import "server-only";
import type { Configuracion, Turno } from "@/lib/types";
import { formatearFechaHora } from "@/lib/datetime";

const LOCALE_POR_MONEDA: Record<Configuracion["moneda_activa"], string> = {
  ARS: "es-AR",
  EUR: "es-ES",
};

/**
 * ENTREGABLE 3 · Controlador genérico de mensajería WhatsApp.
 *
 * Realiza un POST a un endpoint de API de mensajería. La estructura del payload
 * sigue el formato típico de proveedores tipo WhatsApp Cloud / 360dialog; basta
 * con ajustar la URL/token por variables de entorno para integrar uno real.
 *
 * No lanza excepción al caller: la mensajería es "best-effort" y nunca debe
 * tumbar el flujo de reserva. Devuelve un booleano de éxito.
 */
export async function enviarNotificacionWhatsApp(
  telefono: string,
  mensaje: string,
): Promise<boolean> {
  const url = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_API_TOKEN;

  if (!url || !token) {
    console.warn(
      "[whatsapp] WHATSAPP_API_URL/TOKEN no configurados; mensaje omitido.",
    );
    return false;
  }

  try {
    const respuesta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: telefono,
        type: "text",
        text: { body: mensaje },
      }),
      // Evita que un proveedor lento bloquee indefinidamente.
      signal: AbortSignal.timeout(8000),
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text().catch(() => "");
      console.error(
        `[whatsapp] Respuesta ${respuesta.status}: ${detalle.slice(0, 200)}`,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("[whatsapp] Error de red al enviar mensaje:", error);
    return false;
  }
}

/** Mensaje de notificación instantánea al barbero tras una reserva. */
export function construirMensajeBarbero(
  turno: Pick<Turno, "nombre_cliente" | "telefono_cliente" | "fecha_hora_inicio">,
  config: Configuracion,
): string {
  const locale = LOCALE_POR_MONEDA[config.moneda_activa];
  const cuando = formatearFechaHora(
    turno.fecha_hora_inicio,
    config.zona_horaria,
    locale,
  );
  return [
    "✂️ *Nueva reserva en Wallss*",
    "",
    `👤 Cliente: ${turno.nombre_cliente}`,
    `📞 Teléfono: ${turno.telefono_cliente}`,
    `🗓️ Turno: ${cuando}`,
  ].join("\n");
}

/** Recordatorio al cliente (preparado para el job programado futuro). */
export function construirMensajeRecordatorio(
  turno: Pick<Turno, "nombre_cliente" | "fecha_hora_inicio">,
  config: Configuracion,
): string {
  const locale = LOCALE_POR_MONEDA[config.moneda_activa];
  const cuando = formatearFechaHora(
    turno.fecha_hora_inicio,
    config.zona_horaria,
    locale,
  );
  return [
    `Hola ${turno.nombre_cliente} 👋`,
    "",
    `Te recordamos tu turno en *Wallss*: ${cuando}.`,
    "Si no podés asistir, avisanos para liberar el horario. ¡Te esperamos!",
  ].join("\n");
}
