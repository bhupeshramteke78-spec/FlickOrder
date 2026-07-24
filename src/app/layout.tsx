import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://flick-order.vercel.app"),
  title: {
    default: "FlickOrder",
    template: "%s | FlickOrder",
  },
  description:
    "Premium in-restaurant ordering, service, payment, and operations platform for modern restaurants.",
  keywords: [
    "restaurant QR ordering",
    "restaurant management software",
    "UPI restaurant payments",
    "dine-in ordering",
    "FlickOrder",
  ],
  openGraph: {
    title: "FlickOrder",
    description: "Premium in-restaurant QR ordering, service, payment, and operations platform.",
    url: "/",
    siteName: "FlickOrder",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlickOrder",
    description: "Premium in-restaurant QR ordering, service, payment, and operations platform.",
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
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
