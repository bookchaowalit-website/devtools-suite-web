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
  title: "Number Base Converter",
  description: "Convert integers between binary, octal, decimal, and hexadecimal.",
  alternates: { canonical: "/number-converter" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`tool-root t-number-converter ${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</div>;
}
