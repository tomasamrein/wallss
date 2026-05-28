import { obtenerConfiguracion } from "@/lib/config";
import { obtenerResumenClientes } from "@/lib/stats";
import { formatearFechaHora } from "@/lib/datetime";
import type { Moneda } from "@/lib/types";

const LOCALE_POR_MONEDA: Record<Moneda, string> = { ARS: "es-AR", EUR: "es-ES" };

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const config = await obtenerConfiguracion();
  const locale = LOCALE_POR_MONEDA[config.moneda_activa];
  const clientes = await obtenerResumenClientes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-neutral-400">
          Historial de clientes ({clientes.length}).
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900/80 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Teléfono</th>
              <th className="px-4 py-3 font-medium">Turnos</th>
              <th className="px-4 py-3 font-medium">Último turno</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                  Todavía no hay clientes registrados.
                </td>
              </tr>
            ) : (
              clientes.map((c) => (
                <tr key={c.telefono} className="hover:bg-neutral-900/40">
                  <td className="px-4 py-3 font-medium">{c.nombre}</td>
                  <td className="px-4 py-3 text-neutral-300">{c.telefono}</td>
                  <td className="px-4 py-3">{c.total_turnos}</td>
                  <td className="px-4 py-3 text-neutral-400">
                    {formatearFechaHora(c.ultimo_turno, config.zona_horaria, locale)}
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
