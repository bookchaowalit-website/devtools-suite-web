import type { Metadata } from "next";
import { Sora, Roboto_Mono } from "next/font/google";
import "./tool.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});
const roboto = Roboto_Mono({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Diff / Desk — forensic text comparison",
  description: "Compare two texts line-by-line and highlight additions and removals.",
  alternates: { canonical: "/diffchecker" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`tool-root t-diffchecker ${sora.variable} ${roboto.variable} antialiased`}>{children}</div>;
}
