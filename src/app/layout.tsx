import type { Metadata, Viewport } from "next";
import { ThemeScript } from "@/components/shared/ThemeScript";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://simi-peru.vercel.app"),
  title: "SIMI",
  description: "Sistema operativo para restaurantes, cartas digitales, pedidos y reservas.",
  icons: {
    icon: "/simi/brand_app_icons/SIMI_icono.svg",
    shortcut: "/simi/brand_app_icons/SIMI_icono.svg",
    apple: "/simi/brand_app_icons/SIMI_icono.svg"
  },
  openGraph: {
    title: "SIMI",
    description: "Sistema operativo para restaurantes, cartas digitales, pedidos y reservas.",
    images: ["/simi/brand_app_icons/SIMI_icono.svg"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
