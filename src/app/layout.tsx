import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SagePay — Cross-Chain Payments via EIP-7702",
    template: "%s | SagePay",
  },
  description:
    "Chat-powered cross-chain payments. Send, swap, and request crypto across Arbitrum, Ethereum, and Base with natural language. Powered by Particle Network Universal Accounts and EIP-7702.",
  keywords: [
    "cross-chain payments",
    "EIP-7702",
    "Particle Network",
    "Universal Accounts",
    "chain abstraction",
    "crypto payments",
    "Arbitrum",
    "payment links",
  ],
  authors: [{ name: "SagePay" }],
  openGraph: {
    title: "SagePay — Cross-Chain Payments via EIP-7702",
    description:
      "Chat to send, swap, and request crypto across chains. One balance, any chain, any token.",
    type: "website",
    siteName: "SagePay",
  },
  twitter: {
    card: "summary_large_image",
    title: "SagePay — Cross-Chain Payments via EIP-7702",
    description:
      "Chat to send, swap, and request crypto across chains. Powered by Particle Network.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
