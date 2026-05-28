import { NextResponse, type NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { obtenerConfiguracion } from "@/lib/config";
import {
  construirMensajeRecordatorio,
  enviarNotificacionWhatsApp,
} from "@/lib/whatsapp";

/**
 * Endpoint de recordatorios al cliente, pensado para ser invocado por un
 * cron (Vercel Cron, Supabase pg_cron + http, GitHub Actions, etc.).
 *
 *   GET /api/recordatorios?ventana=60
 *
 * Envía un WhatsApp a cada cliente con turno dentro de la ventana indicada
 * (en minutos, por defecto 60). Protegido por la cabecera Authorization con
 * el CRON_SECRET. La lógica de "ya enviado" se deja como TODO del MVP: para
 * producción conviene una columna `recordatorio_enviado_en` en `turnos`.
 */
export async function GET(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (secreto) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secreto}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const ventana = Number(req.nextUrl.searchParams.get("ventana") ?? "60");
  const ahora = new Date();
  const limite = new Date(ahora.getTime() + ventana * 60_000);

  const config = await obtenerConfiguracion();
  const supabase = getAdminClient();

  const { data: turnos, error } = await supabase
    .from("turnos")
    .select("nombre_cliente, telefono_cliente, fecha_hora_inicio")
    .gte("fecha_hora_inicio", ahora.toISOString())
    .lte("fecha_hora_inicio", limite.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let enviados = 0;
  for (const t of turnos ?? []) {
    const mensaje = construirMensajeRecordatorio(t, config);
    const ok = await enviarNotificacionWhatsApp(t.telefono_cliente, mensaje);
    if (ok) enviados += 1;
  }

  return NextResponse.json({ procesados: turnos?.length ?? 0, enviados });
}
