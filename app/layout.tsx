import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./workbench.css";
import { SITE_URL, SUITE_NAME } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-wb", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SUITE_NAME} - browser developer tools`, template: `%s | ${SUITE_NAME}` },
  description: "Seventeen developer tools in one place. Everything runs in your browser; nothing you type is uploaded.",
  authors: [{ name: "Bookchaowalit", url: "https://bookchaowalit.com" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SUITE_NAME,
    title: `${SUITE_NAME} - browser developer tools`,
    description: "Seventeen developer tools in one place. Everything runs in your browser; nothing you type is uploaded.",
    url: "/",
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, colorScheme: "light dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="suite-header">
          <Link href="/" className="suite-brand">{SUITE_NAME}</Link>
          <nav aria-label="Suite">
            <Link href="/">All tools</Link>
            <a href="https://bookchaowalit.com/" className="suite-hub">Bookchaowalit</a>
          </nav>
        </header>
        <div id="main" tabIndex={-1}>{children}</div>
        <footer className="suite-footer">
          <nav aria-label="Site">
            <a href="https://bookchaowalit.com/">More projects</a>
            <a href="https://github.com/bookchaowalit-website/devtools-suite-web">Source</a>
            <a href="https://bookchaowalit.com/privacy">Privacy</a>
            <a href="https://monitor.bookchaowalit.com/">Status</a>
            <a href="mailto:bookchaowalit.work@gmail.com">Contact</a>
          </nav>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
