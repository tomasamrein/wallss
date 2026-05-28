"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actualizarEstadoTurno, cancelarTurno } from "@/app/actions/turnos";
import type { EstadoTurno } from "@/lib/types";

export function ControlEstadoTurno({
  id,
  estado: estadoInicial,
}: {
  id: string;
  estado: EstadoTurno;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [estado, setEstado] = useState<EstadoTurno>(estadoInicial);

  function marcar(nuevo: EstadoTurno) {
    // Tocar de nuevo el estado activo lo vuelve a 'pendiente'.
    const destino: EstadoTurno = estado === nuevo ? "pendiente" : nuevo;
    setEstado(destino);
    startTransition(async () => {
      const res = await actualizarEstadoTurno(id, destino);
      if (!res.ok) {
        setEstado(estadoInicial);
      } else {
        router.refresh();
      }
    });
  }

  function cancelar() {
    if (!confirm("¿Cancelar este turno? Se libera el horario.")) return;
    startTransition(async () => {
      const res = await cancelarTurno(id);
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="flex gap-1.5" aria-busy={pendiente}>
      <button
        type="button"
        onClick={() => marcar("completado")}
        disabled={pendiente}
        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
          estado === "completado"
            ? "border-transparent bg-emerald-600 text-white"
            : "border-line bg-surface text-neutral-300 hover:border-emerald-600/60"
        }`}
      >
        Vino
      </button>
      <button
        type="button"
        onClick={() => marcar("ausente")}
        disabled={pendiente}
        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
          estado === "ausente"
            ? "border-transparent bg-red-700 text-white"
            : "border-line bg-surface text-neutral-300 hover:border-red-700/60"
        }`}
      >
        No vino
      </button>
      <button
        type="button"
        onClick={cancelar}
        disabled={pendiente}
        title="Cancelar turno"
        className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-neutral-400 transition hover:border-red-700/60 hover:text-red-300 disabled:opacity-50"
      >
        Cancelar
      </button>
    </div>
  );
}
