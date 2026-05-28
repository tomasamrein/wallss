"use client";

import Image from "next/image";
import { useActionState } from "react";
import { iniciarSesionAdmin } from "@/app/actions/auth";

export default function LoginAdmin() {
  const [estado, formAction, pendiente] = useActionState(iniciarSesionAdmin, {});

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

      <form action={formAction} className="space-y-4">
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          autoFocus
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none transition focus:border-gold"
        />
        {estado?.error && (
          <p className="rounded-xl border border-red-800/50 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">
            {estado.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pendiente}
          className="w-full rounded-2xl bg-gradient-to-b from-gold-light to-gold-dark py-3.5 font-bold text-ink shadow-lg shadow-gold-dark/30 transition active:scale-[0.98] disabled:opacity-60"
        >
          {pendiente ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
