"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actualizarConfiguracion } from "@/app/actions/configuracion";
import type { Configuracion, Moneda } from "@/lib/types";

const ZONAS_SUGERIDAS = [
  "America/Argentina/Buenos_Aires",
  "Europe/Madrid",
  "America/Mexico_City",
  "America/Bogota",
  "Europe/London",
];

export function FormularioConfiguracion({ config }: { config: Configuracion }) {
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
      });
      if (res.ok) {
        setMensaje({ tipo: "ok", texto: "Configuración guardada." });
        router.refresh();
      } else {
        setMensaje({ tipo: "error", texto: res.error });
      }
    });
  }

  return (
    <div className="space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
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
        className="w-full rounded-xl bg-white py-3 font-semibold text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
      >
        {pendiente ? "Guardando…" : "Guardar cambios"}
      </button>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #404040;
          background: #0a0a0a;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus { border-color: #a3a3a3; }
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
