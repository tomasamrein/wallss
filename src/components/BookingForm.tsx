"use client";

import { useState, useTransition } from "react";
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
  onReservado,
}: {
  slotsISO: string[];
  zonaHoraria: string;
  locale: string;
  /** Se llama tras reservar (o si el slot quedó ocupado) para recargar horarios. */
  onReservado?: () => void;
}) {
  const [pendiente, startTransition] = useTransition();
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [website, setWebsite] = useState(""); // honeypot anti-bots
  const [estado, setEstado] = useState<Estado>({ tipo: "idle" });

  if (estado.tipo === "exito") {
    return (
      <div className="rounded-3xl border border-gold/40 bg-gradient-to-b from-surface-2 to-surface p-7 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold text-2xl text-ink">
          ✓
        </div>
        <p className="text-lg font-bold text-gold-light">¡Turno confirmado!</p>
        <p className="mt-1 text-neutral-300">
          Te esperamos a las <strong className="text-white">{estado.hora}</strong>.
        </p>
        <button
          onClick={() => {
            setEstado({ tipo: "idle" });
            setSeleccion(null);
            setNombre("");
            setApellido("");
            setTelefono("");
            onReservado?.();
          }}
          className="mt-5 rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-medium text-neutral-200 transition hover:border-gold/50"
        >
          Reservar otro turno
        </button>
      </div>
    );
  }

  function confirmar() {
    if (!seleccion) return setEstado({ tipo: "error", mensaje: "Elegí un horario." });
    if (!nombre.trim() || !apellido.trim() || !telefono.trim())
      return setEstado({
        tipo: "error",
        mensaje: "Completá nombre, apellido y teléfono.",
      });

    startTransition(async () => {
      const res = await crearTurno({
        nombre_cliente: `${nombre.trim()} ${apellido.trim()}`,
        telefono_cliente: telefono,
        fecha_hora_inicio: seleccion,
        website,
      });
      if (res.ok) {
        setEstado({
          tipo: "exito",
          hora: formatearHora(res.data.fecha_hora_inicio, zonaHoraria, locale),
        });
      } else {
        setEstado({ tipo: "error", mensaje: res.error });
        if (res.codigo === "SLOT_OCUPADO") {
          setSeleccion(null);
          onReservado?.();
        }
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {slotsISO.map((iso) => {
          const activo = seleccion === iso;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => {
                setSeleccion(iso);
                if (estado.tipo === "error") setEstado({ tipo: "idle" });
              }}
              className={`rounded-xl border py-3 text-sm font-semibold tabular-nums transition active:scale-95 ${
                activo
                  ? "border-transparent bg-gradient-to-b from-gold-light to-gold-dark text-ink shadow-lg shadow-gold-dark/30"
                  : "border-line bg-surface text-neutral-200 hover:border-gold/50"
              }`}
            >
              {formatearHora(iso, zonaHoraria, locale)}
            </button>
          );
        })}
      </div>

      {seleccion && (
        <div className="space-y-4 rounded-3xl border border-line bg-surface/70 p-5">
          <p className="text-sm font-medium text-neutral-300">Tus datos</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                inputMode="text"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl border border-line bg-ink px-4 py-3 text-base outline-none transition focus:border-gold"
              />
              <input
                type="text"
                inputMode="text"
                placeholder="Apellido"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className="w-full rounded-xl border border-line bg-ink px-4 py-3 text-base outline-none transition focus:border-gold"
              />
            </div>
            <input
              type="tel"
              inputMode="tel"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full rounded-xl border border-line bg-ink px-4 py-3 text-base outline-none transition focus:border-gold"
            />
            {/* Honeypot: oculto a humanos, los bots tienden a completarlo. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />
          </div>

          {estado.tipo === "error" && (
            <p className="rounded-xl border border-red-800/50 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">
              {estado.mensaje}
            </p>
          )}

          <button
            onClick={confirmar}
            disabled={pendiente}
            className="w-full rounded-2xl bg-gradient-to-b from-gold-light to-gold-dark py-3.5 text-base font-bold text-ink shadow-lg shadow-gold-dark/30 transition active:scale-[0.98] disabled:opacity-60"
          >
            {pendiente ? "Confirmando…" : "Confirmar reserva"}
          </button>
        </div>
      )}

      {!seleccion && estado.tipo === "error" && (
        <p className="rounded-xl border border-red-800/50 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">
          {estado.mensaje}
        </p>
      )}
    </div>
  );
}
