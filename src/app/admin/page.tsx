import { obtenerConfiguracion } from "@/lib/config";
import {
  obtenerGananciasMensuales,
  obtenerTurnosRango,
} from "@/lib/stats";
import { claveDia, formatearHora, horaLocalAUtc } from "@/lib/datetime";
import { formatearDinero } from "@/lib/format";
import { EarningsChart } from "@/components/EarningsChart";
import type { Moneda } from "@/lib/types";

const LOCALE_POR_MONEDA: Record<Moneda, string> = { ARS: "es-AR", EUR: "es-ES" };

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const config = await obtenerConfiguracion();
  const locale = LOCALE_POR_MONEDA[config.moneda_activa];

  const ahora = new Date();
  const hoyClave = claveDia(ahora, config.zona_horaria);
  const [y, m, d] = hoyClave.split("-").map(Number);

  // Rangos en UTC: hoy y la semana en curso (7 días desde hoy) en zona local.
  const inicioHoy = horaLocalAUtc(y, m, d, 0, 0, config.zona_horaria);
  const finHoy = horaLocalAUtc(y, m, d + 1, 0, 0, config.zona_horaria);
  const finSemana = horaLocalAUtc(y, m, d + 7, 0, 0, config.zona_horaria);

  const [turnosHoy, turnosSemana, ganancias] = await Promise.all([
    obtenerTurnosRango(inicioHoy.toISOString(), finHoy.toISOString()),
    obtenerTurnosRango(inicioHoy.toISOString(), finSemana.toISOString()),
    obtenerGananciasMensuales(config),
  ]);

  const gananciaMesActual = ganancias.at(-1)?.ganancia ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-neutral-400">
          Moneda: {config.moneda_activa} · Zona: {config.zona_horaria}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Tarjeta titulo="Turnos hoy" valor={String(turnosHoy.length)} />
        <Tarjeta titulo="Turnos (7 días)" valor={String(turnosSemana.length)} />
        <Tarjeta
          titulo="Ganancia del mes"
          valor={formatearDinero(gananciaMesActual, config.moneda_activa)}
          destacado
        />
      </div>

      <section className="rounded-2xl border border-line bg-surface/60 p-5">
        <h2 className="mb-4 text-lg font-semibold">Ganancias mensuales</h2>
        <EarningsChart datos={ganancias} moneda={config.moneda_activa} />
        <p className="mt-2 text-xs text-neutral-500">
          Estimadas como turnos × precio de corte ({formatearDinero(config.precio_corte, config.moneda_activa)}).
        </p>
      </section>

      <section className="rounded-2xl border border-line bg-surface/60 p-5">
        <h2 className="mb-4 text-lg font-semibold">Turnos de hoy</h2>
        {turnosHoy.length === 0 ? (
          <p className="py-6 text-center text-neutral-400">No hay turnos para hoy.</p>
        ) : (
          <ul className="divide-y divide-neutral-800">
            {turnosHoy.map((t) => (
              <li key={t.id} className="flex items-center gap-4 py-3">
                <span className="w-14 font-mono text-sm text-neutral-300">
                  {formatearHora(t.fecha_hora_inicio, config.zona_horaria, locale)}
                </span>
                <span className="font-medium">{t.nombre_cliente}</span>
                <span className="ml-auto text-sm text-neutral-400">
                  {t.telefono_cliente}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Tarjeta({
  titulo,
  valor,
  destacado = false,
}: {
  titulo: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        destacado
          ? "border-gold/40 bg-gradient-to-b from-surface-2 to-surface"
          : "border-line bg-surface/60"
      }`}
    >
      <p className="text-sm text-neutral-400">{titulo}</p>
      <p className={`mt-1 text-3xl font-bold ${destacado ? "text-gold-light" : ""}`}>
        {valor}
      </p>
    </div>
  );
}
