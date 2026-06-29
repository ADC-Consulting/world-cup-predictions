import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "ADC World Cup 2026",
  description: "Office prediction game for FIFA World Cup 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0e1a] text-slate-100">
        <Providers>
          <Nav />
          <main className="max-w-screen-2xl mx-auto px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
