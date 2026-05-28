"use client";

import { useActionState } from "react";
import { iniciarSesionAdmin } from "@/app/actions/auth";

export default function LoginAdmin() {
  const [estado, formAction, pendiente] = useActionState(iniciarSesionAdmin, {});

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-2xl font-black tracking-tight">WALLSS · Admin</h1>
      <p className="mb-6 text-sm text-neutral-400">Ingresá para gestionar los turnos.</p>

      <form action={formAction} className="space-y-4">
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          autoFocus
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
        />
        {estado?.error && (
          <p className="rounded-lg border border-red-800/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {estado.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pendiente}
          className="w-full rounded-xl bg-white py-3 font-semibold text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
        >
          {pendiente ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
