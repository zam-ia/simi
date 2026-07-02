import type { Metadata, Viewport } from "next";
import { ThemeScript } from "@/components/shared/ThemeScript";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://simi-peru.vercel.app"),
  title: "SIMI",
  description: "Sistema operativo para restaurantes, cartas digitales, pedidos y reservas.",
  icons: {
    icon: "/simi/brand_app_icons/favicon.svg",
    shortcut: "/simi/brand_app_icons/favicon.svg",
    apple: "/simi/brand_app_icons/app-icon-source-512.svg"
  },
  openGraph: {
    title: "SIMI",
    description: "Sistema operativo para restaurantes, cartas digitales, pedidos y reservas.",
    images: ["/simi/previews/preview_app_icon.png"]
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
