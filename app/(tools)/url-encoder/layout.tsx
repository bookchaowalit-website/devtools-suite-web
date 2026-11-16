import type { Metadata } from "next";
import { toolOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  title: "URL Encoder & Decoder",
  description: "Encode and decode URL components in the browser.",
  alternates: { canonical: "/url-encoder" },
  openGraph: toolOpenGraph("url-encoder", "URL Encoder & Decoder", "Encode and decode URL components in the browser."),
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-url-encoder">{children}</div>;
}
