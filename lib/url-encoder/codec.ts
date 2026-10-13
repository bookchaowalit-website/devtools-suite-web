export type Mode = "component-encode" | "component-decode" | "uri-encode" | "uri-decode";

export const MODES: Array<{ id: Mode; label: string; scope: string }> = [
  { id: "component-encode", label: "encodeURIComponent", scope: "query value" },
  { id: "component-decode", label: "decodeURIComponent", scope: "query value" },
  { id: "uri-encode", label: "encodeURI", scope: "full address" },
  { id: "uri-decode", label: "decodeURI", scope: "full address" },
];

export type Result = { ok: true; value: string } | { ok: false; error: string };

/**
 * Runs the selected codec. `plusAsSpace` treats "+" as a space when decoding
 * (application/x-www-form-urlencoded, e.g. HTML form query strings).
 */
export function convert(mode: Mode, input: string, plusAsSpace = false): Result {
  try {
    switch (mode) {
      case "component-encode":
        return { ok: true, value: encodeURIComponent(input) };
      case "component-decode":
        return { ok: true, value: decodeURIComponent(plusAsSpace ? input.replace(/\+/g, " ") : input) };
      case "uri-encode":
        return { ok: true, value: encodeURI(input) };
      case "uri-decode":
        return { ok: true, value: decodeURI(plusAsSpace ? input.replace(/\+/g, " ") : input) };
    }
  } catch (error) {
    // Encoding only throws for a lone UTF-16 surrogate (half of an emoji), not for bad percent-escapes.
    const reason = !(error instanceof URIError)
      ? "Could not process input."
      : mode.endsWith("encode")
        ? "The text contains half of an emoji or other character (a lone UTF-16 surrogate) that cannot be encoded as UTF-8."
        : "Malformed percent-encoding (a % must be followed by two hex digits forming valid UTF-8).";
    return { ok: false, error: reason };
  }
}

/** The mode that reverses `mode`, used by the swap action. */
export function inverse(mode: Mode): Mode {
  const map: Record<Mode, Mode> = {
    "component-encode": "component-decode",
    "component-decode": "component-encode",
    "uri-encode": "uri-decode",
    "uri-decode": "uri-encode",
  };
  return map[mode];
}

export type QueryRow = { key: string; value: string };
export type QueryResult = { ok: true; rows: QueryRow[] } | { ok: false; error: string };

/**
 * Split a full URL or a bare query string into decoded key/value rows, using
 * form-encoding rules (`+` is a space) like the browser's URLSearchParams.
 * Repeated keys are kept in order; the fragment (#…) is ignored.
 */
export function inspectQuery(input: string): QueryResult {
  const text = input.trim();
  if (!text) return { ok: false, error: "Paste a URL or query string to inspect." };
  const withoutFragment = text.split("#")[0];
  const mark = withoutFragment.indexOf("?");
  // Without a "?", a full URL or path has no query even if its path contains "=".
  if (mark < 0 && (!withoutFragment.includes("=") || /^([a-z][a-z0-9+.-]*:|\/)/i.test(withoutFragment))) return { ok: false, error: "No query string found (expected ?key=value)." };
  const query = mark >= 0 ? withoutFragment.slice(mark + 1) : withoutFragment;
  const rows = [...new URLSearchParams(query)].map(([key, value]) => ({ key, value }));
  if (rows.length === 0) return { ok: false, error: "The query string is empty." };
  return { ok: true, rows };
}
