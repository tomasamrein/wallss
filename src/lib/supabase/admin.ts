import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

let cliente: SupabaseClient<Database> | null = null;

/**
 * Cliente Supabase con service_role para uso EXCLUSIVO en el servidor
 * (server actions / server components). Omite RLS, por eso nunca debe
 * importarse desde código que corra en el navegador.
 */
export function getAdminClient(): SupabaseClient<Database> {
  if (cliente) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.",
    );
  }

  cliente = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}
