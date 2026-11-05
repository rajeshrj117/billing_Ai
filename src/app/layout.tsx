import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Provider } from "@/lib/store";
import { Shell } from "@/components/Shell";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "ScanBill AI – Handwritten Bill Scanner & Daily Sales Tracker",
    template: "%s | ScanBill AI",
  },
  description: "Scan handwritten bills and daily amount lists with your camera. AI reads individual amounts, identifies crossed-out entries, calculates totals, and saves your bill history.",
  applicationName: "ScanBill AI",
  keywords: [
    "handwritten bill scanner", "AI bill scanner", "handwritten amount reader",
    "daily sales calculator", "bill amount scanner", "handwritten receipt scanner",
    "shop billing app", "daily collection tracker", "sales total calculator",
    "camera bill scanner", "crossed out amount detection"
  ],
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "ScanBill AI" },
  openGraph: {
    type: "website",
    siteName: "ScanBill AI",
    title: "ScanBill AI – Scan Handwritten Bills & Calculate Totals",
    description: "Capture handwritten bill amounts, review AI readings, ignore cancelled entries and calculate your total in seconds.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ScanBill AI handwritten bill scanner" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScanBill AI – Handwritten Bill Scanner",
    description: "Scan handwritten amounts, review entries and calculate bill totals.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
};
export const viewport: Viewport = {
  themeColor: "#071832",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Provider><Shell>{children}</Shell></Provider></body></html>;
}
