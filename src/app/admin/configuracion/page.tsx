import { obtenerConfiguracion } from "@/lib/config";
import { FormularioConfiguracion } from "@/components/FormularioConfiguracion";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const config = await obtenerConfiguracion();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-sm text-neutral-400">
          Moneda, zona horaria y parámetros de la agenda.
        </p>
      </div>
      <FormularioConfiguracion config={config} />
    </div>
  );
}
