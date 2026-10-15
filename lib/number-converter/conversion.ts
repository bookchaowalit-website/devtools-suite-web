export function parseInteger(raw: string, radix: number) {
  let value = raw.trim();
  let negative = false;
  if (value.startsWith("-")) { negative = true; value = value.slice(1); }
  if (radix === 16) value = value.replace(/^0x/i, "");
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
