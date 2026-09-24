import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://khaoscan.vercel.app"),
  title: {
    default: "KhaoScan - Modern QR Restaurant Ordering & Operations",
    template: "%s | KhaoScan",
  },
  description:
    "Premium in-restaurant QR ordering, kitchen management, UPI payments, and dining operations platform.",
  keywords: [
    "restaurant QR ordering",
    "restaurant management software",
    "UPI restaurant payments",
    "dine-in ordering",
    "KhaoScan",
  ],
  openGraph: {
    title: "KhaoScan",
    description: "Premium in-restaurant QR ordering, kitchen management, UPI payments, and dining operations platform.",
    url: "/",
    siteName: "KhaoScan",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KhaoScan",
    description: "Premium in-restaurant QR ordering, kitchen management, UPI payments, and dining operations platform.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <QueryProvider>{children}</QueryProvider>
        <SpeedInsights />
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
