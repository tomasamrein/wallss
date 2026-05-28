import Image from "next/image";
import { obtenerConfiguracion } from "@/lib/config";
import { obtenerSetFeriados } from "@/lib/feriados";
import { getAdminClient } from "@/lib/supabase/admin";
import { calcularSlotsDisponibles, esDiaCerrado } from "@/lib/availability";
import { claveDia, horaLocalAUtc } from "@/lib/datetime";
import { BookingForm } from "@/components/BookingForm";
import { SelectorDias } from "@/components/SelectorDias";
import type { Moneda } from "@/lib/types";

const LOCALE_POR_MONEDA: Record<Moneda, string> = { ARS: "es-AR", EUR: "es-ES" };
const DIAS_VISIBLES = 14;

export const dynamic = "force-dynamic";

export default async function PaginaPublica({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha } = await searchParams;
  const config = await obtenerConfiguracion();
  const feriados = await obtenerSetFeriados();
  const locale = LOCALE_POR_MONEDA[config.moneda_activa];

  // Lista de días seleccionables (hoy + próximos), en la zona de la barbería.
  const hoyClave = claveDia(new Date(), config.zona_horaria);
  const [hy, hm, hd] = hoyClave.split("-").map(Number);
  const dias = Array.from({ length: DIAS_VISIBLES }, (_, i) => {
    const instante = horaLocalAUtc(hy, hm, hd + i, 12, 0, config.zona_horaria);
    const iso = claveDia(instante, config.zona_horaria);
    const partes = new Intl.DateTimeFormat(locale, {
      timeZone: config.zona_horaria,
      weekday: "short",
      day: "numeric",
    }).formatToParts(instante);
    const semana = partes.find((p) => p.type === "weekday")?.value ?? "";
    const numero = partes.find((p) => p.type === "day")?.value ?? "";
    return {
      iso,
      semana: semana.replace(".", ""),
      numero,
      esHoy: i === 0,
      cerrado: esDiaCerrado(iso, config, feriados),
    };
  });

  // Solo es seleccionable un día visible que no esté cerrado.
  const fechaSeleccionada = dias.some((d) => d.iso === fecha && !d.cerrado)
    ? fecha!
    : null;

  // Si hay día elegido, calculamos sus horarios disponibles.
  let slotsISO: string[] = [];
  let fechaLegible = "";
  if (fechaSeleccionada) {
    const [year, month, day] = fechaSeleccionada.split("-").map(Number);
    const inicioDia = horaLocalAUtc(year, month, day, 0, 0, config.zona_horaria);
    const finDia = horaLocalAUtc(year, month, day + 1, 0, 0, config.zona_horaria);

    const supabase = getAdminClient();
    const { data: ocupados } = await supabase
      .from("turnos")
      .select("fecha_hora_inicio")
      .gte("fecha_hora_inicio", inicioDia.toISOString())
      .lt("fecha_hora_inicio", finDia.toISOString());

    slotsISO = calcularSlotsDisponibles({
      fechaISO: fechaSeleccionada,
      config,
      turnosOcupadosISO: (ocupados ?? []).map((t) => t.fecha_hora_inicio),
      feriados,
    }).map((s) => s.toISOString());

    fechaLegible = new Intl.DateTimeFormat(locale, {
      timeZone: config.zona_horaria,
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(inicioDia);
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-16 pt-8 sm:pt-12">
      <header className="mb-8 flex flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="Wallss Barber"
          width={1000}
          height={805}
          priority
          className="h-auto w-60 sm:w-72"
        />
        <p className="mt-3 text-sm text-neutral-400">
          Reservá tu turno en segundos.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          1 · Elegí el día
        </h2>
        <SelectorDias dias={dias} seleccionada={fechaSeleccionada} />
      </section>

      {fechaSeleccionada ? (
        <section className="mt-8">
          <h2 className="mb-3 flex items-baseline gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            2 · Elegí el horario
            <span className="font-normal capitalize text-gold">{fechaLegible}</span>
          </h2>
          {slotsISO.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface/70 p-8 text-center text-neutral-400">
              No quedan horarios para este día. Probá con otra fecha.
            </div>
          ) : (
            <BookingForm
              slotsISO={slotsISO}
              zonaHoraria={config.zona_horaria}
              locale={locale}
            />
          )}
        </section>
      ) : (
        <p className="mt-10 text-center text-sm text-neutral-500">
          Tocá un día para ver los horarios disponibles.
        </p>
      )}

      <footer className="mt-12 text-center text-xs text-neutral-600">
        Los turnos se reservan con un mínimo de 1 hora de antelación.
      </footer>
    </main>
  );
}
