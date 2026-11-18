import { parseInteger } from "@/lib/number-converter/conversion";

export type Base = "bin" | "oct" | "dec" | "hex";
export const RADIX: Record<Base, number> = { bin: 2, oct: 8, dec: 10, hex: 16 };

/**
 * The last number that converted (all four fields agree on it) kept apart from the one field being edited
 * while its text does not convert. Only that field shows its own text; every other field shows `valid`,
 * so text typed earlier into a different field can never linger there unmarked.
 */
export type FieldsState = { valid: Record<Base, string>; draft: { base: Base; raw: string; message: string } | null };

const EMPTY: Record<Base, string> = { bin: "", oct: "", dec: "", hex: "" };

export function fromInteger(number: bigint): Record<Base, string> {
  return { bin: number.toString(2), oct: number.toString(8), dec: number.toString(10), hex: number.toString(16) };
}

export function initialFields(number: bigint): FieldsState {
  return { valid: fromInteger(number), draft: null };
}

export function editField(state: FieldsState, base: Base, raw: string): FieldsState {
  if (!raw.trim()) return { valid: EMPTY, draft: null };
  try {
    return { valid: fromInteger(parseInteger(raw, RADIX[base])), draft: null };
  } catch (cause) {
    return { valid: state.valid, draft: { base, raw, message: cause instanceof Error ? cause.message : "This value cannot be converted." } };
  }
}

/** What a field shows: its own text while it is the invalid one, otherwise the last valid number. */
export function shownValue(state: FieldsState, base: Base): string {
  return state.draft?.base === base ? state.draft.raw : state.valid[base];
}
