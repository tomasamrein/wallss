import Link from "next/link";
import { cerrarSesionAdmin } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-800 bg-neutral-900/60">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-5 py-4">
          <span className="text-lg font-black tracking-tight">WALLSS</span>
          <nav className="flex gap-4 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-neutral-300 hover:text-white">
                {n.label}
              </Link>
            ))}
          </nav>
          <form action={cerrarSesionAdmin} className="ml-auto">
            <button className="text-sm text-neutral-400 hover:text-white">Salir</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
