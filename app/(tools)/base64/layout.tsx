import type { Metadata } from "next";
import { Barlow_Condensed, Fira_Code } from "next/font/google";
import "./tool.css";

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
const fira = Fira_Code({
  variable: "--font-fira",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Exposure / 64 — Base64 bench",
  description: "Encode and decode Base64 text fully in the browser. UTF-8 safe, no upload.",
  alternates: { canonical: "/base64" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`tool-root t-base64 ${barlow.variable} ${fira.variable} antialiased`}>{children}</div>;
}
