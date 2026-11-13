import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hash Generator",
  description: "Generate SHA fingerprints locally with the Web Crypto API.",
  alternates: { canonical: "/hashgen" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-hashgen">{children}</div>;
}
