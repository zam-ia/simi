import type { Metadata, Viewport } from "next";
import { ThemeScript } from "@/components/shared/ThemeScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIMI",
  description: "Sistema multi-cliente para cartas digitales con QR permanente."
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
