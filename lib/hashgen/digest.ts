export const algorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
export type Algorithm = (typeof algorithms)[number];
export async function makeDigest(algorithm: Algorithm, value: string) { const bytes = await crypto.subtle.digest(algorithm, new TextEncoder().encode(value)); return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
