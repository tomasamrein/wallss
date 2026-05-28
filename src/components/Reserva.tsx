"use client";

import { useState, useTransition } from "react";
import { slotsDeDia } from "@/app/actions/disponibilidad";
import { SelectorDias, type Dia } from "@/components/SelectorDias";
import { BookingForm } from "@/components/BookingForm";

export function Reserva({
  dias,
  zonaHoraria,
  locale,
}: {
  dias: Dia[];
  zonaHoraria: string;
  locale: string;
}) {
  const [pendiente, startTransition] = useTransition();
  const [sel, setSel] = useState<Dia | null>(null);
  const [slots, setSlots] = useState<string[]>([]);

  function elegir(dia: Dia) {
    if (dia.cerrado || dia.iso === sel?.iso) return;
    setSel(dia); // resalta al instante
    setSlots([]);
    startTransition(async () => {
      const r = await slotsDeDia(dia.iso);
      setSlots(r.slots);
    });
  }

  function recargar() {
    if (!sel) return;
    startTransition(async () => {
      const r = await slotsDeDia(sel.iso);
      setSlots(r.slots);
    });
  }

  return (
    <>
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          1 · Elegí el día
        </h2>
        <SelectorDias dias={dias} seleccionada={sel?.iso ?? null} onSelect={elegir} />
      </section>

      {sel ? (
        <section className="mt-8">
          <h2 className="mb-3 flex items-baseline gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            2 · Elegí el horario
            <span className="font-normal capitalize text-gold">{sel.legible}</span>
          </h2>

          {pendiente ? (
            <SkeletonSlots />
          ) : slots.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface/70 p-8 text-center text-neutral-400">
              No quedan horarios para este día. Probá con otra fecha.
            </div>
          ) : (
            <BookingForm
              slotsISO={slots}
              zonaHoraria={zonaHoraria}
              locale={locale}
              onReservado={recargar}
            />
          )}
        </section>
      ) : (
        <p className="mt-10 text-center text-sm text-neutral-500">
          Tocá un día para ver los horarios disponibles.
        </p>
      )}
    </>
  );
}

function SkeletonSlots() {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-11 animate-pulse rounded-xl border border-line bg-surface"
        />
      ))}
    </div>
  );
}
