import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wallss · Reservá tu turno",
  description: "Sistema de turnos de la barbería Wallss.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
