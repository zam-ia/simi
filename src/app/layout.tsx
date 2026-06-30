import type { Metadata } from "next";
import { ThemeScript } from "@/components/shared/ThemeScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIMI",
  description: "Sistema multi-cliente para cartas digitales con QR permanente."
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
