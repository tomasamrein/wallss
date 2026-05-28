import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegistrarSW } from "@/components/RegistrarSW";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wallss.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Wallss Barber · Reservá tu turno",
  description: "Reservá tu turno en la barbería Wallss en segundos.",
  openGraph: {
    title: "Wallss Barber · Reservá tu turno",
    description: "Reservá tu turno en la barbería Wallss en segundos.",
    url: SITE_URL,
    siteName: "Wallss Barber",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Wallss Barber" }],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wallss Barber · Reservá tu turno",
    description: "Reservá tu turno en la barbería Wallss en segundos.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        {children}
        <RegistrarSW />
      </body>
    </html>
  );
}
