import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Base64 Encoder & Decoder",
  description: "Encode and decode Base64 text fully in the browser. UTF-8 safe, no upload.",
  alternates: { canonical: "/base64" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-base64">{children}</div>;
}
