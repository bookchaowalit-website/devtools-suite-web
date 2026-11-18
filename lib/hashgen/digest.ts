export const algorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
export type Algorithm = (typeof algorithms)[number];
export type DigestFormat = "hex" | "HEX" | "base64";

/** Digest bytes of text (UTF-8) or of raw bytes such as a file. */
export async function digestBytes(algorithm: Algorithm, value: string | ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  const data = typeof value === "string" ? new TextEncoder().encode(value) : value instanceof Uint8Array ? value : new Uint8Array(value);
  return new Uint8Array(await crypto.subtle.digest(algorithm, data as BufferSource));
}

export function formatDigest(bytes: Uint8Array, format: DigestFormat = "hex"): string {
  if (format === "base64") {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }
  const hex = Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return format === "HEX" ? hex.toUpperCase() : hex;
}

export async function makeDigest(algorithm: Algorithm, value: string) { return formatDigest(await digestBytes(algorithm, value)); }

/**
 * Compares a pasted, expected hash with the digest, in any of the three formats. Hex ignores case, spaces and a
 * "sha256:"-style prefix; Base64 must match exactly. "empty" while nothing is pasted.
 */
export function compareDigest(expected: string, bytes: Uint8Array): "empty" | "match" | "mismatch" {
  const raw = expected.trim();
  if (!raw) return "empty";
  const hex = raw.replace(/^[a-z0-9-]+:/i, "").replace(/\s+/g, "").toLowerCase();
  if (/^[0-9a-f]+$/.test(hex)) return hex === formatDigest(bytes) ? "match" : "mismatch";
  return raw.replace(/\s+/g, "") === formatDigest(bytes, "base64") ? "match" : "mismatch";
}
