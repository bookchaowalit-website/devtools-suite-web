import assert from "node:assert/strict";
import { test } from "node:test";
import { SNIPPETS, filterSnippets } from "../lib/snippets/catalog.ts";
import { handleMcpRequest, TOOLS } from "../lib/snippets/mcp.ts";

const call = (name: string, args: Record<string, unknown>, id: number | string = 7) =>
  handleMcpRequest({ jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } });
const payload = (response: ReturnType<typeof handleMcpRequest>) => {
  const result = response?.result as { content: { text: string }[]; isError: boolean };
  return { data: JSON.parse(result.content[0].text), isError: result.isError };
};

test("initialize and tools/list echo the request id", () => {
  assert.equal(handleMcpRequest({ jsonrpc: "2.0", id: "a", method: "initialize" })?.id, "a");
  assert.deepEqual(handleMcpRequest({ jsonrpc: "2.0", id: 2, method: "tools/list" })?.result, { tools: TOOLS });
});
test("get_all returns the same catalog the page renders", () => {
  assert.deepEqual(payload(call("get_all", {})).data, SNIPPETS);
});
test("search and category filtering share filterSnippets with the page", () => {
  for (const [query, category] of [["HOOK", "All"], ["", "Python"], ["hook", "Python"], ["types", "TypeScript"]]) {
    assert.deepEqual(payload(call("search", { query, category })).data, filterSnippets(SNIPPETS, query, category));
  }
  assert.deepEqual(payload(call("search", { query: "decorator" })).data.map((s: { id: string }) => s.id), ["2"]);
});
test("get_by_id finds a snippet or reports a tool error", () => {
  assert.equal(payload(call("get_by_id", { id: "3" })).data.title, "Typed Result");
  assert.equal(payload(call("get_by_id", { id: "404" })).isError, true);
});
test("invalid requests, arguments, tools and methods return JSON-RPC errors", () => {
  assert.equal(handleMcpRequest(null)?.error?.code, -32600);
  assert.equal(handleMcpRequest({ jsonrpc: "2.0", id: 1 })?.error?.code, -32600);
  assert.equal(call("search", {})?.error?.code, -32602);
  assert.equal(call("get_by_id", { id: 3 })?.error?.code, -32602);
  assert.equal(call("delete_all", {})?.error?.code, -32602);
  assert.equal(handleMcpRequest({ jsonrpc: "2.0", id: 1, method: "resources/list" })?.error?.code, -32601);
});
test("notifications get no response", () => {
  assert.equal(handleMcpRequest({ jsonrpc: "2.0", method: "notifications/initialized" }), null);
});
