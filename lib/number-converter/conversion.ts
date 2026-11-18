export function parseInteger(raw: string, radix: number) {
  // Spaces and underscores are digit-group separators (1111 0000, 0xff_ff), as the display and many languages use.
  let value = raw.trim().replace(/[\s_]/g, "");
  let negative = false;
  if (value.startsWith("-")) { negative = true; value = value.slice(1); }
  const prefix: Record<number, RegExp> = { 2: /^0b/i, 8: /^0o/i, 16: /^0x/i };
  if (prefix[radix]) value = value.replace(prefix[radix], "");
  const patterns: Record<number, RegExp> = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[0-9a-f]+$/i };
  if (!value || !patterns[radix].test(value)) throw new Error("Use only the digits allowed by this base.");
  let number = BigInt(0);
  const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
  for (const character of value.toLowerCase()) {
    const digit = BigInt(digits.indexOf(character));
    if (digit < 0 || digit >= BigInt(radix)) throw new Error("This digit is outside the selected base.");
    number = number * BigInt(radix) + digit;
  }
  return negative ? -number : number;
}
