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
  title: "Markdown Editor",
  description: "Split-pane Markdown editor with a lightweight live preview.",
  alternates: { canonical: "/markdown-editor" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`tool-root t-markdown-editor ${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</div>;
}
