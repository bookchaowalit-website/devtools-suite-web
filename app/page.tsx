import { ToolCatalog } from "@/components/tool-catalog";
import { TOOLS, toolPath } from "@/lib/tools";

const ENTRIES = TOOLS.map(({ slug, name, description, keywords, group }) => ({ slug, name, description, keywords, group, path: toolPath({ slug }) }));

export default function Catalog() {
  return (
    <main id="main" tabIndex={-1} className="catalog">
      <h1>Developer tools that run in your browser</h1>
      <p className="catalog-lede">
        {TOOLS.length} developer tools in one place, grouped by job; nothing you type is uploaded.
      </p>
      <ToolCatalog tools={ENTRIES} />
    </main>
  );
}
