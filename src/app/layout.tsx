import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Playfair_Display, Lora, Source_Sans_3 } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { publicSettings } from "@/lib/settings";

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const serif = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });
const sans = Source_Sans_3({ subsets: ["latin", "latin-ext"], variable: "--font-source", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Kitab — Ethiopian Ebook Marketplace", template: "%s | Kitab" },
  description: "Discover digital books from Ethiopian and international authors. Read, learn, and support the people behind every story.",
  applicationName: "Kitab",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }], shortcut: "/favicon.svg" },
  openGraph: { siteName: "Kitab", type: "website", locale: "en_ET" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#183C32" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const ann = String((await publicSettings()).announcement ?? "");
  return (
    <html lang="en">
      <body className={`${display.variable} ${serif.variable} ${sans.variable} min-h-screen`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-forest focus:px-4 focus:py-2 focus:text-sm focus:text-ivory">Skip to content</a>
        <Header announcement={ann} />
        <main id="main-content" className="min-h-[50vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
