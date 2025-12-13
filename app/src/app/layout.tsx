import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";
import { VersionFooter } from "@/components/ui/VersionFooter";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// PWA Viewport configuration
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
    { media: "(prefers-color-scheme: dark)", color: "#6366f1" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  colorScheme: "dark",
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studek.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Studek | AI Flashcards with FSRS Spaced Repetition",
  description:
    "Create high-quality flashcards from PDFs, videos, and notes in seconds. Study smarter with FSRS spaced repetition, offline-first sync, and AI tools—without the setup.",
  keywords: [
    "Studek",
    "AI flashcards",
    "spaced repetition",
    "flashcards",
    "flashcard maker",
    "AI study app",
    "FSRS",
    "study app",
    "memory",
    "learning",
    "medical school",
    "MCAT",
    "USMLE",
    "language learning",
  ],
  authors: [{ name: "Studek" }],
  alternates: {
    canonical: "/",
  },
  // PWA Manifest
  manifest: "/manifest.json",
  // Apple PWA meta tags
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Studek",
    startupImage: [
      {
        url: "/splash/apple-splash-2048-2732.png",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/apple-splash-1668-2388.png",
        media:
          "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/apple-splash-1536-2048.png",
        media:
          "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/apple-splash-1290-2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/apple-splash-1179-2556.png",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/apple-splash-1170-2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  // Format detection
  formatDetection: {
    telephone: false,
  },
  // Application name for browsers
  applicationName: "Studek",
  // Icons
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.svg"],
  },
  openGraph: {
    title: "Studek | AI Flashcards with FSRS Spaced Repetition",
    description:
      "Create flashcards from PDFs, videos, and notes in seconds. Study with FSRS spaced repetition and AI tools—no setup.",
    type: "website",
    locale: "en_US",
    siteName: "Studek",
    url: siteUrl,
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Studek",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Studek | AI Flashcards with FSRS Spaced Repetition",
    description:
      "Create flashcards from PDFs, videos, and notes in seconds. Study with FSRS spaced repetition and AI tools—no setup.",
    images: ["/icons/icon-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  // Additional PWA-related meta
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#6366f1",
    "msapplication-tap-highlight": "no",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Script
            id="jsonld-studek"
            type="application/ld+json"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify([
                {
                  "@context": "https://schema.org",
                  "@type": "WebSite",
                  name: "Studek",
                  url: siteUrl,
                  description:
                    "Create flashcards from PDFs, videos, and notes in seconds. Study with FSRS spaced repetition and AI tools.",
                },
                {
                  "@context": "https://schema.org",
                  "@type": "SoftwareApplication",
                  name: "Studek",
                  applicationCategory: "EducationalApplication",
                  operatingSystem: "Web",
                  url: siteUrl,
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                  },
                },
              ]),
            }}
          />
          {children}
          <VersionFooter />
          <ServiceWorkerRegistration />
        </Providers>
      </body>
    </html>
  );
}
