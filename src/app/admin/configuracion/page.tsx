import { obtenerConfiguracion } from "@/lib/config";
import { obtenerFeriados } from "@/lib/feriados";
import { FormularioConfiguracion } from "@/components/FormularioConfiguracion";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const [config, feriados] = await Promise.all([
    obtenerConfiguracion(),
    obtenerFeriados(),
  ]);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-sm text-neutral-400">
          Moneda, zona horaria, agenda y días cerrados.
        </p>
      </div>
      <FormularioConfiguracion config={config} feriados={feriados} />
    </div>
  );
}
