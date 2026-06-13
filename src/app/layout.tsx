import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { Providers } from "@/app/providers";
import { Sidebar } from "@/components/shell/Sidebar";
import { TickerTape } from "@/components/shell/TickerTape";
import { TopBar } from "@/components/shell/TopBar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "IFT · Indian Financial Intelligence Terminal",
  description:
    "Institutional-grade market intelligence terminal for Indian equities: live indices, movers, research, news and watchlists.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          <div className="flex h-screen flex-col overflow-hidden">
            <TopBar />
            <TickerTape />
            <div className="flex min-h-0 flex-1">
              <Sidebar />
              <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
