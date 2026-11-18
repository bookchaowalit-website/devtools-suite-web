import { ToolCatalog } from "@/components/tool-catalog";
import { SUITE_NAME } from "@/lib/site";
import { TOOLS, toolPath } from "@/lib/tools";

const ENTRIES = TOOLS.map(({ slug, name, description, keywords }) => ({ slug, name, description, keywords, path: toolPath({ slug }) }));

export default function Catalog() {
  return (
    <div className="catalog">
      <h1>{SUITE_NAME}</h1>
      <p className="catalog-lede">
        {TOOLS.length} developer tools in one place. Every tool runs in your browser; nothing you type is uploaded.
      </p>
      <ToolCatalog tools={ENTRIES} />
    </div>
  );
}
