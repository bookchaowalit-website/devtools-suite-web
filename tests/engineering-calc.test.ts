import { describe, it } from "node:test";
import { expect } from "./support/expect.ts";
import { convertLoad, formulaFor, fromKn, KGF_PER_KN, loadBounds, loadUnit, momentUnit, roundForUnit, solve, toKn, validate } from "../lib/engineering-calc/beam.ts";

describe("solve", () => {
  it("uses wL²/8 and wL/2 for distributed loads", () => {
    const result = solve("uniform", 4, 10);
    expect(result.moment).toBeCloseTo(20);
    expect(result.shear).toBeCloseTo(20);
    expect(solve("service", 6, 2).moment).toBeCloseTo(9);
  });

  it("uses PL/4 and P/2 for a mid-span point load", () => {
    const result = solve("point", 4.2, 7);
    expect(result.moment).toBeCloseTo(7.35);
    expect(result.shear).toBeCloseTo(3.5);
  });
});

describe("validate", () => {
  it("accepts in-range values", () => {
    expect(validate(4.2, 4)).toEqual({ ok: true });
  });

  it("rejects empty, NaN and out-of-range input", () => {
    expect(validate(0, 4)).toMatchObject({ ok: false });
    expect(validate(Number.NaN, 4)).toMatchObject({ ok: false });
    const both = validate(20, 0);
    expect(both.ok ? [] : both.errors).toHaveLength(2);
  });
});

describe("labels", () => {
  it("matches formula and unit to the load case", () => {
    expect(formulaFor("point").moment).toBe("M = P · L / 4");
    expect(formulaFor("uniform").moment).toBe("M = w · L² / 8");
    expect(loadUnit("point")).toBe("kN");
    expect(loadUnit("service")).toBe("kN/m");
  });
});

describe("unit conversion", () => {
  it("uses standard gravity: 1 kN ≈ 101.97 kgf", () => {
    expect(KGF_PER_KN).toBeCloseTo(101.9716, 4);
    expect(fromKn(1, "kgf")).toBeCloseTo(101.9716, 4);
    expect(toKn(1000, "kgf")).toBeCloseTo(9.80665, 5);
    expect(toKn(fromKn(4.2, "kgf"), "kgf")).toBeCloseTo(4.2, 10);
    expect(fromKn(3, "kN")).toBe(3);
  });

  it("labels loads and moments in the chosen unit", () => {
    expect(loadUnit("uniform", "kgf")).toBe("kgf/m");
    expect(loadUnit("point", "kgf")).toBe("kgf");
    expect(momentUnit("kgf")).toBe("kgf·m");
    expect(momentUnit()).toBe("kN·m");
  });

  it("validates kgf input against the same physical range", () => {
    expect(validate(4, 400, "kgf")).toEqual({ ok: true });
    expect(validate(4, 5, "kgf")).toEqual({ ok: false, errors: ["Load must be between 11 and 5098 kgf."] });
    expect(roundForUnit(fromKn(LOAD_MAX_KN, "kgf"), "kgf")).toBe(5099);
  });

  it("gives the same physical moment whichever unit the load was entered in", () => {
    const kn = solve("uniform", 5, 4).moment;
    const viaKgf = fromKn(solve("uniform", 5, toKn(fromKn(4, "kgf"), "kgf")).moment, "kgf");
    expect(viaKgf).toBeCloseTo(kn * KGF_PER_KN, 8);
  });
});

const LOAD_MAX_KN = 50;

describe("unit rounding at the pass/fail threshold", () => {
  it("advertises only kgf bounds that are really inside the kN range", () => {
    expect(loadBounds("kN")).toEqual({ min: 0.1, max: 50 });
    expect(loadBounds("kgf")).toEqual({ min: 11, max: 5098 });
  });

  it("rejects kgf loads that round to the advertised limit but fall outside it in kN", () => {
    // 10 kgf = 0.098 kN (< 0.1 kN) and 5099 kgf = 50.003 kN (> 50 kN).
    expect(validate(4, 10, "kgf")).toMatchObject({ ok: false });
    expect(validate(4, 5099, "kgf")).toMatchObject({ ok: false });
    expect(validate(4, 11, "kgf")).toEqual({ ok: true });
    expect(validate(4, 5098, "kgf")).toEqual({ ok: true });
    expect(validate(4, 0.1)).toEqual({ ok: true });
    expect(validate(4, 50)).toEqual({ ok: true });
  });

  it("keeps an in-range load in range when switching units", () => {
    expect(convertLoad(0.1, "kN", "kgf")).toBe(11);
    expect(convertLoad(50, "kN", "kgf")).toBe(5098);
    expect(convertLoad(4, "kN", "kgf")).toBe(408);
    expect(convertLoad(11, "kgf", "kN")).toBe(0.11);
    expect(convertLoad(Number.NaN, "kN", "kgf")).toBeNaN();
  });
});
