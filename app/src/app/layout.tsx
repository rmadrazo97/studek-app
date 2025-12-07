import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";
import { VersionFooter } from "@/components/ui/VersionFooter";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";

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

export const metadata: Metadata = {
  title: "Studek | The Power of Anki. The Simplicity of AI.",
  description:
    "Master any subject with zero setup. Studek combines the world's most powerful spaced repetition algorithm (FSRS) with next-gen AI. Turn PDFs, videos, and notes into intelligent flashcards in seconds.",
  keywords: [
    "spaced repetition",
    "flashcards",
    "AI study",
    "FSRS",
    "Anki alternative",
    "study app",
    "memory",
    "learning",
    "medical school",
    "USMLE",
    "language learning",
  ],
  authors: [{ name: "Studek" }],
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
    title: "Studek | The Power of Anki. The Simplicity of AI.",
    description:
      "Master any subject with zero setup. Turn PDFs, videos, and notes into intelligent flashcards in seconds.",
    type: "website",
    locale: "en_US",
    siteName: "Studek",
  },
  twitter: {
    card: "summary_large_image",
    title: "Studek | The Power of Anki. The Simplicity of AI.",
    description:
      "Master any subject with zero setup. Turn PDFs, videos, and notes into intelligent flashcards in seconds.",
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
          {children}
          <VersionFooter />
          <ServiceWorkerRegistration />
        </Providers>
      </body>
    </html>
  );
}
