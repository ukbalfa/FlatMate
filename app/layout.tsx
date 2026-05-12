import { Sora, DM_Sans, DM_Mono, Space_Grotesk, DM_Serif_Display } from "next/font/google";
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

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-space-grotesk",
  display: 'swap',
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dm-serif-display",
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export const metadata = {
  title: {
    default: "FlatMate | Co-living without the chaos",
    template: "%s | FlatMate"
  },
  description: "FlatMate helps you split bills, track chores, and manage your household seamlessly. The ultimate app for roommates to live in harmony.",
  keywords: ["roommate app", "bill splitting", "chore management", "household organization", "shared living", "flat sharing", "expense tracker", "roommate expenses", "household bills"],
  authors: [{ name: "FlatMate Team", url: "https://flatmate.app/about" }],
  creator: "FlatMate",
  publisher: "FlatMate",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://flatmate.app",
    title: "FlatMate | Co-living without the chaos",
    description: "FlatMate helps you split bills, track chores, and manage your household seamlessly. The ultimate app for roommates to live in harmony.",
    siteName: "FlatMate",
    images: [
      {
        url: "https://flatmate.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FlatMate - Co-living without the chaos"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "FlatMate | Co-living without the chaos",
    description: "FlatMate helps you split bills, track chores, and manage your household seamlessly.",
    creator: "@flatmateapp",
    images: ["https://flatmate.app/twitter-image.jpg"],
    site: "@flatmateapp"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  alternates: {
    canonical: "https://flatmate.app",
    languages: {
      'en-US': '/en-US',
      'es-ES': '/es-ES'
    }
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  manifest: "/site.webmanifest",
  verification: {
    google: "GOOGLE_SITE_VERIFICATION_CODE"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0A0A0A" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="canonical" href="https://flatmate.app" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "FlatMate",
              "url": "https://flatmate.app",
              "description": "FlatMate helps you split bills, track chores, and manage your household seamlessly. The ultimate app for roommates to live in harmony.",
              "applicationCategory": "LifestyleApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "url": "https://flatmate.app/pricing"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "1250"
              }
            })
          }}
        />
        
        {/* Preload critical assets */}
        <link rel="preload" href="/assets/noise.svg" as="image" />
      </head>
      <body className={`${sora.variable} ${dmSans.variable} ${dmMono.variable} ${spaceGrotesk.variable} ${dmSerifDisplay.variable} font-sans`} suppressHydrationWarning>
        <ClientThemeProvider>
          <LangSync />
          <Providers>{children}</Providers>
        </ClientThemeProvider>
      </body>
    </html>
  );
}