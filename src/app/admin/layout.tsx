import Image from "next/image";
import Link from "next/link";
import { cerrarSesionAdmin } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/configuracion", label: "Config" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-ink/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:gap-6 sm:px-5">
          <Link href="/admin" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Wallss Barber"
              width={1000}
              height={805}
              className="h-8 w-auto"
            />
          </Link>
          <nav className="flex gap-3 text-sm sm:gap-5">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-neutral-300 transition hover:text-gold"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <form action={cerrarSesionAdmin} className="ml-auto">
            <button className="text-sm text-neutral-500 transition hover:text-gold">
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-5 sm:py-8">{children}</main>
    </div>
  );
}
