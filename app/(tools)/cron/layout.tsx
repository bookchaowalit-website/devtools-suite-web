import type { Metadata } from "next";
import { toolOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cron Expression Helper",
  description: "Build and explain standard 5-field cron expressions and preview next run times.",
  alternates: { canonical: "/cron" },
  openGraph: toolOpenGraph("cron", "Cron Expression Helper", "Build and explain standard 5-field cron expressions and preview next run times."),
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-cron">{children}</div>;
}
