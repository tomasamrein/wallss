import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-5xl font-black text-gold-light">404</h1>
      <p className="mt-2 text-neutral-400">Esta página no existe.</p>
      <Link
        href="/"
        className="mt-6 rounded-xl border border-line bg-surface px-6 py-3 font-medium text-neutral-200 transition hover:border-gold/50"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
