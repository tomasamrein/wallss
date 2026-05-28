import { obtenerConfiguracion } from "@/lib/config";
import { obtenerResumenClientes } from "@/lib/stats";
import { TablaClientes } from "@/components/TablaClientes";
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

      <TablaClientes
        clientes={clientes}
        zonaHoraria={config.zona_horaria}
        locale={locale}
      />
    </div>
  );
}
