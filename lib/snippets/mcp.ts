import { SNIPPETS, filterSnippets, type Snippet } from "./catalog.ts";

// JSON-RPC 2.0 MCP handler for the snippet catalog. It reads the same SNIPPETS
// source and filterSnippets function as the /snippets page, so the page and the
// MCP route cannot drift apart.

type JsonRpcId = string | number | null;
export type McpResponse = { jsonrpc: "2.0"; id: JsonRpcId; result?: unknown; error?: { code: number; message: string } };

export const PROTOCOL_VERSION = "2024-11-05";

export const TOOLS = [
  { name: "get_all", description: "List every snippet", inputSchema: { type: "object", properties: {} } },
  { name: "get_by_id", description: "Get one snippet by id", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  {
    name: "search",
    description: "Search snippets by title, language, category or tag, optionally within one category",
    inputSchema: { type: "object", properties: { query: { type: "string" }, category: { type: "string" } }, required: ["query"] },
  },
];

const ok = (id: JsonRpcId, result: unknown): McpResponse => ({ jsonrpc: "2.0", id, result });
const fail = (id: JsonRpcId, code: number, message: string): McpResponse => ({ jsonrpc: "2.0", id, error: { code, message } });
const content = (data: unknown, isError = false) => ({ content: [{ type: "text", text: JSON.stringify(data) }], isError });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function callTool(name: unknown, args: Record<string, unknown>, snippets: Snippet[]) {
  switch (name) {
    case "get_all":
      return content(snippets);
    case "get_by_id": {
      if (typeof args.id !== "string") return null;
      const snippet = snippets.find(item => item.id === args.id);
      return snippet ? content(snippet) : content({ error: `Snippet not found: ${args.id}` }, true);
    }
    case "search": {
      if (typeof args.query !== "string" || (args.category !== undefined && typeof args.category !== "string")) return null;
      return content(filterSnippets(snippets, args.query, args.category ?? "All"));
    }
    default:
      return undefined;
  }
}

/** Returns null for notifications, which get no JSON-RPC response. */
export function handleMcpRequest(body: unknown, snippets: Snippet[] = SNIPPETS): McpResponse | null {
  if (!isRecord(body) || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return fail(null, -32600, "Invalid Request");
  }
  const hasId = "id" in body;
  const id: JsonRpcId = typeof body.id === "string" || typeof body.id === "number" ? body.id : null;
  if (!hasId) return null;
  const params = isRecord(body.params) ? body.params : {};

  switch (body.method) {
    case "initialize":
      return ok(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "bookchaowalit-snippets", version: "1.0.0" },
      });
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      const args = isRecord(params.arguments) ? params.arguments : {};
      const result = callTool(params.name, args, snippets);
      if (result === undefined) return fail(id, -32602, `Unknown tool: ${String(params.name)}`);
      if (result === null) return fail(id, -32602, `Invalid arguments for ${String(params.name)}`);
      return ok(id, result);
    }
    default:
      return fail(id, -32601, `Method not found: ${body.method}`);
  }
}
