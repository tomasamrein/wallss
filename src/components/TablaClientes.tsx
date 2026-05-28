"use client";

import { useMemo, useState } from "react";
import { formatearFechaHora } from "@/lib/datetime";
import type { ClienteResumen } from "@/lib/types";

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
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
