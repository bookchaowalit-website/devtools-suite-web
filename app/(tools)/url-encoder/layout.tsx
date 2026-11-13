import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "URL Encoder & Decoder",
  description: "Encode and decode URL components in the browser.",
  alternates: { canonical: "/url-encoder" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-url-encoder">{children}</div>;
}
