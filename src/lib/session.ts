// ============================================================================
//  Token de sesión admin firmado con HMAC-SHA256 (Web Crypto).
//  Funciona tanto en el route handler (Node) como en el middleware (Edge).
//  Formato del token: "<expiraciónMs>.<firmaHex>".
// ============================================================================

const enc = new TextEncoder();

async function importarClave(secreto: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function aHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Comparación de strings hex en tiempo (cuasi) constante. */
function comparaSegura(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Crea un token de sesión firmado, válido por `ttlMs` milisegundos. */
export async function crearTokenSesion(secreto: string, ttlMs: number): Promise<string> {
  const exp = String(Date.now() + ttlMs);
  const clave = await importarClave(secreto);
  const firma = await crypto.subtle.sign("HMAC", clave, enc.encode(exp));
  return `${exp}.${aHex(firma)}`;
}

/** Valida firma + expiración de un token de sesión. */
export async function validarTokenSesion(
  secreto: string,
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const [exp, firma] = token.split(".");
  if (!exp || !firma) return false;
  if (!Number.isFinite(Number(exp)) || Number(exp) < Date.now()) return false;
  const clave = await importarClave(secreto);
  const esperada = aHex(await crypto.subtle.sign("HMAC", clave, enc.encode(exp)));
  return comparaSegura(esperada, firma);
}
