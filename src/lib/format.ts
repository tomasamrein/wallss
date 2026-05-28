// ============================================================================
//  Formateo de dinero con el API nativo Intl.NumberFormat.
//  Puro: usable tanto en server como en client components.
// ============================================================================
import type { Moneda } from "@/lib/types";

const LOCALE_POR_MONEDA: Record<Moneda, string> = {
  ARS: "es-AR",
  EUR: "es-ES",
};

/**
 * Formatea un monto según la moneda activa de la configuración global.
 * Cambiar `moneda_activa` de "ARS" a "EUR" reformatea todo el dashboard
 * sin tocar el código (blindaje para internacionalización).
 */
export function formatearDinero(monto: number, moneda: Moneda): string {
  return new Intl.NumberFormat(LOCALE_POR_MONEDA[moneda], {
    style: "currency",
    currency: moneda,
  }).format(monto);
}
