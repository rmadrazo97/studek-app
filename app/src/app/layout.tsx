import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";
import { VersionFooter } from "@/components/ui/VersionFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        </Providers>
      </body>
    </html>
  );
}
