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
  title: "Specimen / Index",
  description: "A small local code specimen library: filter, read and copy reusable snippets.",
  alternates: { canonical: "/snippets" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`tool-root t-snippets ${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</div>;
}
