import Image from "next/image";

export default async function LoginAdmin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="Wallss Barber"
          width={1000}
          height={805}
          priority
          className="h-auto w-48"
        />
        <p className="mt-3 text-sm text-neutral-400">Panel de gestión</p>
      </div>

      <form action="/api/login" method="post" className="space-y-4">
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          autoFocus
          required
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none transition focus:border-gold"
        />
        {error && (
          <p className="rounded-xl border border-red-800/50 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">
            Contraseña incorrecta.
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-b from-gold-light to-gold-dark py-3.5 font-bold text-ink shadow-lg shadow-gold-dark/30 transition active:scale-[0.98]"
        >
          Ingresar
        </button>
      </form>
    </main>
  );
}
