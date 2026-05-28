"use client";

import { useRouter } from "next/navigation";

/** Selector simple de fecha que recarga la página con ?fecha=YYYY-MM-DD. */
export function SelectorFecha({
  fechaActual,
  hoy,
}: {
  fechaActual: string;
  hoy: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3">
      <label htmlFor="fecha" className="text-sm text-neutral-400">
        Elegí el día
      </label>
      <input
        id="fecha"
        type="date"
        value={fechaActual}
        min={hoy}
        onChange={(e) => router.push(`/?fecha=${e.target.value}`)}
        className="ml-auto rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
      />
    </div>
  );
}
