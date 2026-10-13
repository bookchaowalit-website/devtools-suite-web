import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./tool.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Date Calculator",
  description: "Compute date differences and add or subtract days, weeks, or months.",
  alternates: { canonical: "/date-calculator" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`tool-root t-date-calculator ${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</div>;
}
