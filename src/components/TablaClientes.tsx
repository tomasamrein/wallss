"use client";

import { useMemo, useState } from "react";
import { formatearFechaHora } from "@/lib/datetime";
import type { ClienteResumen } from "@/lib/types";

/** Construye el link wa.me con el teléfono normalizado y un saludo pre-cargado. */
function linkWhatsApp(telefono: string, nombre: string): string {
  const numero = telefono.replace(/[^\d]/g, "");
  const texto = encodeURIComponent(`Hola ${nombre.split(" ")[0]}! 👋`);
  return `https://wa.me/${numero}?text=${texto}`;
}

export function TablaClientes({
  clientes,
  zonaHoraria,
  locale,
}: {
  clientes: ClienteResumen[];
  zonaHoraria: string;
  locale: string;
}) {
  const [q, setQ] = useState("");

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return clientes;
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(t) ||
        c.telefono.toLowerCase().includes(t),
    );
  }, [q, clientes]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre o teléfono…"
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none transition focus:border-gold"
      />

      <div className="overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface/80 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Teléfono</th>
              <th className="px-4 py-3 font-medium">Turnos</th>
              <th className="px-4 py-3 font-medium">Último turno</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  {clientes.length === 0
                    ? "Todavía no hay clientes registrados."
                    : "Sin resultados para esa búsqueda."}
                </td>
              </tr>
            ) : (
              filtrados.map((c) => (
                <tr key={c.telefono} className="hover:bg-surface/40">
                  <td className="px-4 py-3 font-medium">{c.nombre}</td>
                  <td className="px-4 py-3 text-neutral-300">{c.telefono}</td>
                  <td className="px-4 py-3">{c.total_turnos}</td>
                  <td className="px-4 py-3 text-neutral-400">
                    {formatearFechaHora(c.ultimo_turno, zonaHoraria, locale)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={linkWhatsApp(c.telefono, c.nombre)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Escribir a ${c.nombre} por WhatsApp`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/50 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-900/40"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                        <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.515 5.26l-.999 3.648 3.973-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                      WhatsApp
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
