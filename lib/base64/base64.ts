/**
 * UTF-8-safe Base64 helpers that run unchanged in the browser, Node, and the
 * edge runtime (they only rely on TextEncoder/TextDecoder and btoa/atob).
 */

export class Base64Error extends Error {}

const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

/**
 * Encode UTF-8 text as standard (or URL-safe, unpadded) Base64. Text with an
 * unpaired surrogate is rejected: TextEncoder would silently turn it into
 * U+FFFD and the round trip would not give back the input.
 */
export function encodeBase64(text: string, options: { urlSafe?: boolean } = {}): string {
  if (LONE_SURROGATE.test(text)) {
    throw new Base64Error("Input contains a broken character (unpaired UTF-16 surrogate) that cannot be encoded as UTF-8.");
  }
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = btoa(binary);
  return options.urlSafe ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : encoded;
}

/**
 * Normalize user input: strip whitespace/line breaks and invisible characters
 * picked up when copying from web pages (zero-width space/joiners, BOM, soft
 * hyphen), accept the URL-safe
 * alphabet, and restore missing padding. Throws Base64Error on invalid input.
 */
export function normalizeBase64(input: string): string {
  const compact = input.replace(/[\s\u200B-\u200D\u2060\uFEFF\u00AD]+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (compact.length === 0) return "";
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) {
    throw new Base64Error("Input contains characters that are not valid Base64.");
  }
  const unpadded = compact.replace(/=+$/, "");
  if (unpadded.length % 4 === 1) {
    throw new Base64Error("Input length is not valid Base64 (one character too many or too few).");
  }
  const padded = unpadded + "=".repeat((4 - (unpadded.length % 4)) % 4);
  if (compact.includes("=") && compact.length !== padded.length) {
    throw new Base64Error("Input has incorrect '=' padding.");
  }
  return padded;
}

/** Decode Base64 (standard or URL-safe) into UTF-8 text. */
export function decodeBase64(input: string): string {
  const normalized = normalizeBase64(input);
  let binary: string;
  try {
    binary = atob(normalized);
  } catch {
    throw new Base64Error("Input is not valid Base64.");
  }
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Base64Error("Decoded bytes are not valid UTF-8 text (binary payloads are out of scope).");
  }
}

/**
 * What the counters under each tray show: user-perceived characters
 * (graphemes, so an emoji or a Thai syllable with marks counts once instead of
 * by UTF-16 code units) and the UTF-8 byte size that Base64 actually encodes.
 */
export function textStats(text: string): { characters: number; bytes: number } {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  let characters = 0;
  for (const segment of segmenter.segment(text)) {
    if (segment.segment) characters += 1;
  }
  return { characters, bytes: new TextEncoder().encode(text).length };
}

/** "1 character" / "2 characters" style label. */
export function plural(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}
