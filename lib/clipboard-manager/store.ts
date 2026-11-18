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

/** Undo of a delete: the item goes back into the current list unless it is already there. */
export function restoreSnippet(items: Snippet[], item: Snippet): Snippet[] {
  return items.some((existing) => existing.id === item.id) ? items : [...items, item];
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

/** When an item was saved, for the item bar: "just now", "5 minutes ago", "2 hours ago", then "Yesterday 14:05" or a date and time. */
export function savedWhen(createdAt: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - createdAt) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const date = new Date(createdAt);
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return `${date.toLocaleDateString([], { day: "numeric", month: "short", year: date.getFullYear() === new Date(now).getFullYear() ? undefined : "numeric" })}, ${time}`;
}
