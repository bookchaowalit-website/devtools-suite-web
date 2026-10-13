import type { Metadata } from "next";
import { Karla, Courier_Prime } from "next/font/google";
import "./tool.css";

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
});
const courier = Courier_Prime({
  variable: "--font-courier",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Local Dispatch — Clipboard archive",
  description: "Local-only clipboard history snippets stored in localStorage.",
  alternates: { canonical: "/clipboard-manager" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`tool-root t-clipboard-manager ${karla.variable} ${courier.variable} antialiased`}>{children}</div>;
}
