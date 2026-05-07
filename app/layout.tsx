import { Sora, DM_Sans, DM_Mono, Bebas_Neue, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import ClientThemeProvider from "../components/ClientThemeProvider";
import LangSync from "../components/LangSync";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600"],
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["500"],
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-space-grotesk",
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "FlatMate",
  description: "FlatMate Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${sora.variable} ${dmSans.variable} ${dmMono.variable} ${bebasNeue.variable} ${spaceGrotesk.variable} font-sans`} suppressHydrationWarning>
        <ClientThemeProvider>
          <LangSync />
          <Providers>{children}</Providers>
        </ClientThemeProvider>
      </body>
    </html>
  );
}