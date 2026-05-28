import "server-only";
import type { Configuracion, Turno } from "@/lib/types";
import { formatearFechaHora } from "@/lib/datetime";

const LOCALE_POR_MONEDA: Record<Configuracion["moneda_activa"], string> = {
  ARS: "es-AR",
  EUR: "es-ES",
};

const API_VERSION = process.env.WHATSAPP_API_VERSION ?? "v21.0";

function configWhatsApp() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return null;
  return {
    token,
    url: `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`,
  };
}

/** Deja solo dígitos (Cloud API espera el número en formato internacional). */
function normalizarTelefono(telefono: string): string {
  return telefono.replace(/[^\d]/g, "");
}

async function postWhatsApp(payload: Record<string, unknown>): Promise<boolean> {
  const cfg = configWhatsApp();
  if (!cfg) {
    console.warn("[whatsapp] WHATSAPP_TOKEN/PHONE_NUMBER_ID no configurados; mensaje omitido.");
    return false;
  }
  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.token}`,
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const detalle = await res.text().catch(() => "");
      console.error(`[whatsapp] ${res.status}: ${detalle.slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[whatsapp] Error de red al enviar mensaje:", error);
    return false;
  }
}

/**
 * Envía un mensaje de texto libre. Solo funciona DENTRO de la ventana de 24 hs
 * (cuando el destinatario te escribió hace menos de 24 hs). Para mensajes
 * iniciados por el negocio fuera de esa ventana, usar `enviarPlantillaWhatsApp`.
 */
export async function enviarNotificacionWhatsApp(
  telefono: string,
  mensaje: string,
): Promise<boolean> {
  return postWhatsApp({
    to: normalizarTelefono(telefono),
    type: "text",
    text: { body: mensaje, preview_url: false },
  });
}

/**
 * Envía un mensaje basado en una plantilla aprobada en Meta.
 * Es la vía para mensajes iniciados por el negocio (aviso al barbero,
 * recordatorios y confirmaciones a clientes) fuera de la ventana de 24 hs.
 *
 * @param parametros  Valores para los {{1}}, {{2}}… del cuerpo de la plantilla.
 */
export async function enviarPlantillaWhatsApp(
  telefono: string,
  plantilla: string,
  idioma: string,
  parametros: string[] = [],
): Promise<boolean> {
  const components =
    parametros.length > 0
      ? [
          {
            type: "body",
            parameters: parametros.map((text) => ({ type: "text", text })),
          },
        ]
      : undefined;

  return postWhatsApp({
    to: normalizarTelefono(telefono),
    type: "template",
    template: {
      name: plantilla,
      language: { code: idioma },
      ...(components ? { components } : {}),
    },
  });
}

/** Mensaje de notificación instantánea al barbero tras una reserva. */
export function construirMensajeBarbero(
  turno: Pick<Turno, "nombre_cliente" | "telefono_cliente" | "fecha_hora_inicio">,
  config: Configuracion,
): string {
  const locale = LOCALE_POR_MONEDA[config.moneda_activa];
  const cuando = formatearFechaHora(turno.fecha_hora_inicio, config.zona_horaria, locale);
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
  const cuando = formatearFechaHora(turno.fecha_hora_inicio, config.zona_horaria, locale);
  return [
    `Hola ${turno.nombre_cliente} 👋`,
    "",
    `Te recordamos tu turno en *Wallss*: ${cuando}.`,
    "Si no podés asistir, avisanos para liberar el horario. ¡Te esperamos!",
  ].join("\n");
}
