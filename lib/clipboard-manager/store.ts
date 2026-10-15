export type Snippet = { id: string; text: string; createdAt: number; pinned: boolean };

export function addSnippet(items: Snippet[], text: string, id: string, createdAt: number): Snippet[] {
  if (!text.trim()) return items;
  return [{ id, text: text.trim(), createdAt, pinned: false }, ...items];
}

export function togglePin(items: Snippet[], id: string): Snippet[] {
  return items.map(item => item.id === id ? { ...item, pinned: !item.pinned } : item);
}

export function deleteSnippet(items: Snippet[], id: string): Snippet[] {
  return items.filter(item => item.id !== id);
}

export function searchSnippets(items: Snippet[], query: string): Snippet[] {
  return items.filter(item => item.text.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt);
}

export function serializeSnippets(items: Snippet[]): string {
  return JSON.stringify(items);
}

export function deserializeSnippets(raw: string | null): Snippet[] {
  const stored: unknown = JSON.parse(raw || "null");
  if (!Array.isArray(stored)) return [];
  return stored.filter((item): item is Snippet => item !== null && typeof item === "object"
    && typeof item.id === "string" && typeof item.text === "string"
    && typeof item.createdAt === "number" && Number.isFinite(item.createdAt)
    && !Number.isNaN(new Date(item.createdAt).getTime()) && typeof item.pinned === "boolean");
}
