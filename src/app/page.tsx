import { obtenerConfiguracion } from "@/lib/config";
import { getAdminClient } from "@/lib/supabase/admin";
import { calcularSlotsDisponibles } from "@/lib/availability";
import { claveDia, horaLocalAUtc } from "@/lib/datetime";
import { BookingForm } from "@/components/BookingForm";
import { SelectorFecha } from "@/components/SelectorFecha";
import type { Moneda } from "@/lib/types";

const LOCALE_POR_MONEDA: Record<Moneda, string> = { ARS: "es-AR", EUR: "es-ES" };

export const dynamic = "force-dynamic";

export default async function PaginaPublica({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha } = await searchParams;
  const config = await obtenerConfiguracion();
  const locale = LOCALE_POR_MONEDA[config.moneda_activa];

  // Día objetivo: el solicitado (?fecha=YYYY-MM-DD) o "hoy" en la zona de la barbería.
  const hoyClave = claveDia(new Date(), config.zona_horaria);
  const fechaObjetivo = /^\d{4}-\d{2}-\d{2}$/.test(fecha ?? "") ? fecha! : hoyClave;
  const [year, month, day] = fechaObjetivo.split("-").map(Number);

  // Límites UTC del día local para acotar la consulta de turnos ocupados.
  const inicioDia = horaLocalAUtc(year, month, day, 0, 0, config.zona_horaria);
  const finDia = horaLocalAUtc(year, month, day + 1, 0, 0, config.zona_horaria);

  const supabase = getAdminClient();
  const { data: ocupados } = await supabase
    .from("turnos")
    .select("fecha_hora_inicio")
    .gte("fecha_hora_inicio", inicioDia.toISOString())
    .lt("fecha_hora_inicio", finDia.toISOString());

  const slots = calcularSlotsDisponibles({
    fechaISO: fechaObjetivo,
    config,
    turnosOcupadosISO: (ocupados ?? []).map((t) => t.fecha_hora_inicio),
  });

  const fechaLegible = new Intl.DateTimeFormat(locale, {
    timeZone: config.zona_horaria,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(inicioDia);

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-black tracking-tight">WALLSS</h1>
        <p className="mt-1 text-neutral-400">Reservá tu turno en segundos.</p>
      </header>

      <SelectorFecha fechaActual={fechaObjetivo} hoy={hoyClave} />

      <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
        <h2 className="mb-4 text-lg font-semibold capitalize">{fechaLegible}</h2>

        {slots.length === 0 ? (
          <p className="py-8 text-center text-neutral-400">
            No hay horarios disponibles para este día. Probá con otra fecha.
          </p>
        ) : (
          <BookingForm
            slotsISO={slots.map((s) => s.toISOString())}
            zonaHoraria={config.zona_horaria}
            locale={locale}
          />
        )}
      </section>

      <footer className="mt-8 text-center text-xs text-neutral-600">
        Los turnos se reservan con un mínimo de 1 hora de antelación.
      </footer>
    </main>
  );
}
