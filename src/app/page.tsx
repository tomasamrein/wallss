import Image from "next/image";
import { obtenerConfiguracion } from "@/lib/config";
import { obtenerSetFeriados } from "@/lib/feriados";
import { esDiaCerrado } from "@/lib/availability";
import { claveDia, horaLocalAUtc } from "@/lib/datetime";
import { Reserva } from "@/components/Reserva";
import type { Dia } from "@/components/SelectorDias";
import type { Moneda } from "@/lib/types";

const LOCALE_POR_MONEDA: Record<Moneda, string> = { ARS: "es-AR", EUR: "es-ES" };
const DIAS_VISIBLES = 14;

export const dynamic = "force-dynamic";

export default async function PaginaPublica() {
  const [config, feriados] = await Promise.all([
    obtenerConfiguracion(),
    obtenerSetFeriados(),
  ]);
  const locale = LOCALE_POR_MONEDA[config.moneda_activa];

  const hoyClave = claveDia(new Date(), config.zona_horaria);
  const [hy, hm, hd] = hoyClave.split("-").map(Number);

  const fmtChip = new Intl.DateTimeFormat(locale, {
    timeZone: config.zona_horaria,
    weekday: "short",
    day: "numeric",
  });
  const fmtLegible = new Intl.DateTimeFormat(locale, {
    timeZone: config.zona_horaria,
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const dias: Dia[] = Array.from({ length: DIAS_VISIBLES }, (_, i) => {
    const instante = horaLocalAUtc(hy, hm, hd + i, 12, 0, config.zona_horaria);
    const iso = claveDia(instante, config.zona_horaria);
    const partes = fmtChip.formatToParts(instante);
    const semana = partes.find((p) => p.type === "weekday")?.value ?? "";
    const numero = partes.find((p) => p.type === "day")?.value ?? "";
    return {
      iso,
      semana: semana.replace(".", ""),
      numero,
      esHoy: i === 0,
      cerrado: esDiaCerrado(iso, config, feriados),
      legible: fmtLegible.format(instante),
    };
  });

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
        <p className="mt-3 text-sm text-neutral-400">Reservá tu turno en segundos.</p>
      </header>

      <Reserva dias={dias} zonaHoraria={config.zona_horaria} locale={locale} />

      <footer className="mt-12 text-center text-xs text-neutral-600">
        Los turnos se reservan con un mínimo de 1 hora de antelación.
      </footer>
    </main>
  );
}
