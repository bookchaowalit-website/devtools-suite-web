export type Snippet = { id: string; title: string; code: string; language: string; category: string; tags: string[] };
export const SNIPPETS: Snippet[] = [
  { id: "1", title: "React Hook", code: "const useHook = () => {\n  return { ready: true };\n};", language: "javascript", category: "React", tags: ["react", "hook"] },
  { id: "2", title: "Python Decorator", code: "def traced(fn):\n    def wrapper(*args):\n        return fn(*args)\n    return wrapper", language: "python", category: "Python", tags: ["python", "decorator"] },
  { id: "3", title: "Typed Result", code: "type Result<T> =\n  | { ok: true; value: T }\n  | { ok: false; error: Error };", language: "typescript", category: "TypeScript", tags: ["types", "result"] },
];

export function filterSnippets(snippets: Snippet[], query: string, category: string): Snippet[] {
  return snippets.filter(snippet => {
    const text = `${snippet.title} ${snippet.language} ${snippet.category} ${snippet.tags.join(" ")}`.toLowerCase();
    return (category === "All" || snippet.category === category) && text.includes(query.toLowerCase());
  });
}
