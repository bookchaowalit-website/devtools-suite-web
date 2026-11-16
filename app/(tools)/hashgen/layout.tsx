import type { Metadata } from "next";
import { toolOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  title: "Hash Generator",
  description: "Generate SHA fingerprints locally with the Web Crypto API.",
  alternates: { canonical: "/hashgen" },
  openGraph: toolOpenGraph("hashgen", "Hash Generator", "Generate SHA fingerprints locally with the Web Crypto API."),
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-hashgen">{children}</div>;
}
