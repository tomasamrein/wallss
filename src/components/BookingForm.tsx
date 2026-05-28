"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearTurno } from "@/app/actions/turnos";
import { formatearHora } from "@/lib/datetime";

type Estado =
  | { tipo: "idle" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "exito"; hora: string };

export function BookingForm({
  slotsISO,
  zonaHoraria,
  locale,
}: {
  slotsISO: string[];
  zonaHoraria: string;
  locale: string;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState<Estado>({ tipo: "idle" });

  if (estado.tipo === "exito") {
    return (
      <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/40 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-300">¡Turno confirmado!</p>
        <p className="mt-1 text-neutral-300">
          Te esperamos a las <strong>{estado.hora}</strong>.
        </p>
        <button
          onClick={() => {
            setEstado({ tipo: "idle" });
            setSeleccion(null);
            setNombre("");
            setTelefono("");
            router.refresh();
          }}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Reservar otro turno
        </button>
      </div>
    );
  }

  function confirmar() {
    if (!seleccion) {
      setEstado({ tipo: "error", mensaje: "Elegí un horario." });
      return;
    }
    if (!nombre.trim() || !telefono.trim()) {
      setEstado({ tipo: "error", mensaje: "Completá tu nombre y teléfono." });
      return;
    }

    startTransition(async () => {
      const res = await crearTurno({
        nombre_cliente: nombre,
        telefono_cliente: telefono,
        fecha_hora_inicio: seleccion,
      });

      if (res.ok) {
        setEstado({
          tipo: "exito",
          hora: formatearHora(res.data.fecha_hora_inicio, zonaHoraria, locale),
        });
      } else {
        setEstado({ tipo: "error", mensaje: res.error });
        // Si el slot quedó ocupado entre la carga y el envío, refrescamos la grilla.
        if (res.codigo === "SLOT_OCUPADO") router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm text-neutral-400">Horarios disponibles</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slotsISO.map((iso) => {
            const activo = seleccion === iso;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSeleccion(iso)}
                className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                  activo
                    ? "border-white bg-white text-neutral-900"
                    : "border-neutral-700 bg-neutral-950 text-neutral-200 hover:border-neutral-500"
                }`}
              >
                {formatearHora(iso, zonaHoraria, locale)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
        />
        <input
          type="tel"
          placeholder="Tu teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
        />
      </div>

      {estado.tipo === "error" && (
        <p className="rounded-lg border border-red-800/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {estado.mensaje}
        </p>
      )}

      <button
        onClick={confirmar}
        disabled={pendiente}
        className="w-full rounded-xl bg-white py-3 font-semibold text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-50"
      >
        {pendiente ? "Confirmando…" : "Confirmar reserva"}
      </button>
    </div>
  );
}
