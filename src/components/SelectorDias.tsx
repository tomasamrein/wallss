"use client";

import { useRouter } from "next/navigation";

type Dia = {
  iso: string;
  semana: string;
  numero: string;
  esHoy: boolean;
  cerrado: boolean;
};

/** Carrusel horizontal de días. Tocar un día recarga con ?fecha=ISO. */
export function SelectorDias({
  dias,
  seleccionada,
}: {
  dias: Dia[];
  seleccionada: string | null;
}) {
  const router = useRouter();

  return (
    <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-x-visible sm:px-0">
      {dias.map((d) => {
        const activo = seleccionada === d.iso;
        if (d.cerrado) {
          return (
            <div
              key={d.iso}
              title="Cerrado"
              className="flex min-w-[4.25rem] shrink-0 cursor-not-allowed flex-col items-center gap-1 rounded-2xl border border-line/60 bg-surface/40 px-3 py-3 text-neutral-600"
            >
              <span className="text-[11px] font-medium uppercase tracking-wide">
                {d.esHoy ? "Hoy" : d.semana}
              </span>
              <span className="text-xl font-bold leading-none line-through">
                {d.numero}
              </span>
              <span className="text-[9px] uppercase tracking-wide">Cerrado</span>
            </div>
          );
        }
        return (
          <button
            key={d.iso}
            type="button"
            onClick={() => router.push(`/?fecha=${d.iso}`, { scroll: false })}
            className={`flex min-w-[4.25rem] shrink-0 flex-col items-center gap-1 rounded-2xl border px-3 py-3 transition active:scale-95 ${
              activo
                ? "border-transparent bg-gradient-to-b from-gold-light to-gold-dark text-ink shadow-lg shadow-gold-dark/30"
                : "border-line bg-surface text-neutral-300 hover:border-gold/50"
            }`}
          >
            <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">
              {d.esHoy ? "Hoy" : d.semana}
            </span>
            <span className="text-xl font-bold leading-none">{d.numero}</span>
          </button>
        );
      })}
    </div>
  );
}
