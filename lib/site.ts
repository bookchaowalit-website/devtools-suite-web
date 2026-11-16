export const SUITE_NAME = "Devtools Workbench";

/** Canonical origin for metadata, robots.txt and sitemap.xml. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://devtools.bookchaowalit.com").replace(/\/$/, "");

/**
 * Open Graph for one tool page. Next replaces the root openGraph object when a page sets its own,
 * so this repeats the shared fields and adds the page's own URL (otherwise og:url says "/").
 */
export function toolOpenGraph(slug: string, title: string, description: string) {
  return { type: "website" as const, siteName: SUITE_NAME, title: `${title} | ${SUITE_NAME}`, description, url: `/${slug}` };
}
