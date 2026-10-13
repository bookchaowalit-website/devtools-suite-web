import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { TOOLS, toolPath } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    ...TOOLS.map((tool) => ({ url: `${SITE_URL}${toolPath(tool)}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
