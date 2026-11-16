import type { Metadata } from "next";
import { toolOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  title: "Base64 Encoder & Decoder",
  description: "Encode and decode Base64 text fully in the browser. UTF-8 safe, no upload.",
  alternates: { canonical: "/base64" },
  openGraph: toolOpenGraph("base64", "Base64 Encoder & Decoder", "Encode and decode Base64 text fully in the browser. UTF-8 safe, no upload."),
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-base64">{children}</div>;
}
