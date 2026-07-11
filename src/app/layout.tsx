import type { Metadata, Viewport } from "next";
import { ClientMonitoring } from "@/components/shared/ClientMonitoring";
import { ThemeScript } from "@/components/shared/ThemeScript";
import "./globals.css";

const defaultSocialPreview = "/simi/brand_app_icons/simi-og-image.png";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://simi-peru.vercel.app"),
  title: "SIMI",
  description: "Sistema operativo para restaurantes, cartas digitales, pedidos y reservas.",
  icons: {
    icon: [
      { url: "/simi/brand_app_icons/simi-favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/simi/brand_app_icons/simi-favicon-192.png", sizes: "192x192", type: "image/png" }
    ],
    shortcut: "/simi/brand_app_icons/simi-favicon-32.png",
    apple: "/simi/brand_app_icons/simi-apple-touch-icon.png"
  },
  openGraph: {
    title: "SIMI",
    description: "Sistema operativo para restaurantes, cartas digitales, pedidos y reservas.",
    siteName: "SIMI",
    type: "website",
    images: [{ url: defaultSocialPreview, width: 1200, height: 630, alt: "SIMI - Carta digital, pedidos y reservas" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "SIMI",
    description: "Sistema operativo para restaurantes, cartas digitales, pedidos y reservas.",
    images: [defaultSocialPreview]
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
        <ClientMonitoring />
        {children}
      </body>
    </html>
  );
}
