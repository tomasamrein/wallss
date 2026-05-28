"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold text-gold-light">Algo salió mal</h1>
      <p className="mt-2 text-neutral-400">
        Tuvimos un problema cargando esta página. Probá de nuevo.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-xl bg-gradient-to-b from-gold-light to-gold-dark px-6 py-3 font-bold text-ink transition active:scale-[0.98]"
      >
        Reintentar
      </button>
    </main>
  );
}
