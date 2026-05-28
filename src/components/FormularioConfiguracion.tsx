"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  actualizarConfiguracion,
  agregarFeriado,
  eliminarFeriado,
} from "@/app/actions/configuracion";
import type { Configuracion, Feriado, Moneda } from "@/lib/types";

const ZONAS_SUGERIDAS = [
  "America/Argentina/Buenos_Aires",
  "Europe/Madrid",
  "America/Mexico_City",
  "America/Bogota",
  "Europe/London",
];

const DIAS_SEMANA = [
  { n: 0, label: "Dom" },
  { n: 1, label: "Lun" },
  { n: 2, label: "Mar" },
  { n: 3, label: "Mié" },
  { n: 4, label: "Jue" },
  { n: 5, label: "Vie" },
  { n: 6, label: "Sáb" },
];

export function FormularioConfiguracion({
  config,
  feriados,
}: {
  config: Configuracion;
  feriados: Feriado[];
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(
    null,
  );

  const [moneda, setMoneda] = useState<Moneda>(config.moneda_activa);
  const [zona, setZona] = useState(config.zona_horaria);
  const [precio, setPrecio] = useState(String(config.precio_corte));
  const [apertura, setApertura] = useState(String(config.hora_apertura));
  const [cierre, setCierre] = useState(String(config.hora_cierre));
  const [duracion, setDuracion] = useState(String(config.duracion_turno_min));
  const [diasCerrados, setDiasCerrados] = useState<number[]>(
    config.dias_cerrados_semana ?? [],
  );

  const [nuevoFeriado, setNuevoFeriado] = useState("");
  const [descFeriado, setDescFeriado] = useState("");

  function toggleDia(n: number) {
    setDiasCerrados((prev) =>
      prev.includes(n) ? prev.filter((d) => d !== n) : [...prev, n],
    );
  }

  function guardar() {
    setMensaje(null);
    startTransition(async () => {
      const res = await actualizarConfiguracion({
        moneda_activa: moneda,
        zona_horaria: zona,
        precio_corte: Number(precio),
        hora_apertura: Number(apertura),
        hora_cierre: Number(cierre),
        duracion_turno_min: Number(duracion),
        dias_cerrados_semana: diasCerrados,
      });
      if (res.ok) {
        setMensaje({ tipo: "ok", texto: "Configuración guardada." });
        router.refresh();
      } else {
        setMensaje({ tipo: "error", texto: res.error });
      }
    });
  }

  function añadirFeriado() {
    if (!nuevoFeriado) return;
    startTransition(async () => {
      const res = await agregarFeriado(nuevoFeriado, descFeriado);
      if (res.ok) {
        setNuevoFeriado("");
        setDescFeriado("");
        router.refresh();
      } else {
        setMensaje({ tipo: "error", texto: res.error });
      }
    });
  }

  function quitarFeriado(fecha: string) {
    startTransition(async () => {
      const res = await eliminarFeriado(fecha);
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-5 rounded-2xl border border-line bg-surface/60 p-5">
        <Campo etiqueta="Moneda activa">
          <select
            value={moneda}
            onChange={(e) => setMoneda(e.target.value as Moneda)}
            className="input"
          >
            <option value="ARS">ARS · Peso argentino</option>
            <option value="EUR">EUR · Euro</option>
          </select>
        </Campo>

        <Campo etiqueta="Zona horaria (IANA)">
          <input
            list="zonas"
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            className="input"
          />
          <datalist id="zonas">
            {ZONAS_SUGERIDAS.map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
        </Campo>

        <Campo etiqueta="Precio del corte">
          <input
            type="number"
            min={0}
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="input"
          />
        </Campo>

        <div className="grid grid-cols-3 gap-3">
          <Campo etiqueta="Apertura (h)">
            <input
              type="number"
              min={0}
              max={23}
              value={apertura}
              onChange={(e) => setApertura(e.target.value)}
              className="input"
            />
          </Campo>
          <Campo etiqueta="Cierre (h)">
            <input
              type="number"
              min={1}
              max={24}
              value={cierre}
              onChange={(e) => setCierre(e.target.value)}
              className="input"
            />
          </Campo>
          <Campo etiqueta="Duración (min)">
            <input
              type="number"
              min={5}
              step={5}
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
              className="input"
            />
          </Campo>
        </div>

        <div>
          <span className="mb-2 block text-sm text-neutral-400">
            Días cerrados (cada semana)
          </span>
          <div className="flex flex-wrap gap-2">
            {DIAS_SEMANA.map((d) => {
              const activo = diasCerrados.includes(d.n);
              return (
                <button
                  key={d.n}
                  type="button"
                  onClick={() => toggleDia(d.n)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    activo
                      ? "border-transparent bg-gold text-ink"
                      : "border-line bg-ink text-neutral-300 hover:border-gold/50"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {mensaje && (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              mensaje.tipo === "ok"
                ? "border border-emerald-800/50 bg-emerald-950/40 text-emerald-300"
                : "border border-red-800/50 bg-red-950/40 text-red-300"
            }`}
          >
            {mensaje.texto}
          </p>
        )}

        <button
          onClick={guardar}
          disabled={pendiente}
          className="w-full rounded-xl bg-gradient-to-b from-gold-light to-gold-dark py-3 font-bold text-ink transition active:scale-[0.99] disabled:opacity-60"
        >
          {pendiente ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      {/* Feriados / cierres puntuales */}
      <div className="space-y-4 rounded-2xl border border-line bg-surface/60 p-5">
        <h2 className="text-lg font-semibold">Feriados y cierres puntuales</h2>

        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm text-neutral-400">Fecha</span>
            <input
              type="date"
              value={nuevoFeriado}
              onChange={(e) => setNuevoFeriado(e.target.value)}
              className="input"
            />
          </label>
          <label className="block flex-1">
            <span className="mb-1.5 block text-sm text-neutral-400">
              Descripción (opcional)
            </span>
            <input
              type="text"
              value={descFeriado}
              onChange={(e) => setDescFeriado(e.target.value)}
              placeholder="Ej. Feriado nacional"
              className="input"
            />
          </label>
          <button
            type="button"
            onClick={añadirFeriado}
            disabled={pendiente || !nuevoFeriado}
            className="rounded-xl border border-gold/50 bg-ink px-4 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/10 disabled:opacity-50"
          >
            Agregar
          </button>
        </div>

        {feriados.length === 0 ? (
          <p className="text-sm text-neutral-500">No hay feriados cargados.</p>
        ) : (
          <ul className="divide-y divide-line">
            {feriados.map((f) => (
              <li key={f.fecha} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="font-mono text-neutral-300">{f.fecha}</span>
                <span className="text-neutral-400">{f.descripcion}</span>
                <button
                  type="button"
                  onClick={() => quitarFeriado(f.fecha)}
                  disabled={pendiente}
                  className="ml-auto text-neutral-500 transition hover:text-red-300"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #2a2a2a;
          background: #0a0a0a;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          color: inherit;
        }
        .input:focus { border-color: #e89b2d; }
      `}</style>
    </div>
  );
}

function Campo({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-neutral-400">{etiqueta}</span>
      {children}
    </label>
  );
}
