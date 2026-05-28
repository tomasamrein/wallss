import { NextResponse, type NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { obtenerConfiguracion } from "@/lib/config";
import {
  construirMensajeRecordatorio,
  enviarNotificacionWhatsApp,
} from "@/lib/whatsapp";

/**
 * Endpoint de recordatorios al cliente, invocado por un cron (Vercel Cron, que
 * agrega automáticamente `Authorization: Bearer $CRON_SECRET`).
 *
 *   GET /api/recordatorios?ventana=720
 *
 * Envía un WhatsApp a cada cliente con turno pendiente dentro de la ventana
 * indicada (en minutos) que todavía no recibió recordatorio, y marca
 * `recordatorio_enviado_en` para no repetir.
 *
 * Seguridad: SIEMPRE exige CRON_SECRET. Si no está configurado, se rechaza.
 */
export async function GET(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado en el servidor." },
      { status: 500 },
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ventana = Number(req.nextUrl.searchParams.get("ventana") ?? "720");
  const ahora = new Date();
  const limite = new Date(ahora.getTime() + ventana * 60_000);

  const config = await obtenerConfiguracion();
  const supabase = getAdminClient();

  const { data: turnos, error } = await supabase
    .from("turnos")
    .select("id, nombre_cliente, telefono_cliente, fecha_hora_inicio")
    .eq("estado", "pendiente")
    .is("recordatorio_enviado_en", null)
    .gte("fecha_hora_inicio", ahora.toISOString())
    .lte("fecha_hora_inicio", limite.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let enviados = 0;
  for (const t of turnos ?? []) {
    const mensaje = construirMensajeRecordatorio(t, config);
    const ok = await enviarNotificacionWhatsApp(t.telefono_cliente, mensaje);
    if (ok) {
      await supabase
        .from("turnos")
        .update({ recordatorio_enviado_en: new Date().toISOString() })
        .eq("id", t.id);
      enviados += 1;
    }
  }

  return NextResponse.json({ procesados: turnos?.length ?? 0, enviados });
}
