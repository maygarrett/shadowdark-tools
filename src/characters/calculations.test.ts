import { describe, expect, it } from "vitest";
import {
  applyHpFloor,
  calculateAbilityModifier,
  calculateBasicArmorClass,
  calculateDeathTimer,
  calculateForceCheckDc,
  calculateGearSlots,
  formatModifier,
} from "./calculations";

describe("character calculations", () => {
  it("calculates Shadowdark-style ability modifiers", () => {
    expect(calculateAbilityModifier(3)).toBe(-4);
    expect(calculateAbilityModifier(8)).toBe(-1);
    expect(calculateAbilityModifier(10)).toBe(0);
    expect(calculateAbilityModifier(14)).toBe(2);
    expect(calculateAbilityModifier(18)).toBe(4);
  });

  it("formats modifiers with explicit plus signs for non-negative values", () => {
    expect(formatModifier(2)).toBe("+2");
    expect(formatModifier(0)).toBe("+0");
    expect(formatModifier(-1)).toBe("-1");
  });

  it("calculates gear slots as the max of 10 or STR score", () => {
    expect(calculateGearSlots(6)).toBe(10);
    expect(calculateGearSlots(10)).toBe(10);
    expect(calculateGearSlots(14)).toBe(14);
  });

  it("applies a minimum HP floor of 1", () => {
    expect(applyHpFloor(-2)).toBe(1);
    expect(applyHpFloor(0)).toBe(1);
    expect(applyHpFloor(7)).toBe(7);
  });

  it("calculates death timer as 1d4 plus CON modifier, minimum 1", () => {
    expect(calculateDeathTimer(4, 2)).toBe(6);
    expect(calculateDeathTimer(1, -2)).toBe(1);
  });

  it("calculates basic AC as 10 plus DEX modifier", () => {
    expect(calculateBasicArmorClass(2)).toBe(12);
    expect(calculateBasicArmorClass(0)).toBe(10);
    expect(calculateBasicArmorClass(-1)).toBe(9);
  });

  it("calculates Force Check DC as 10 plus power tier", () => {
    expect(calculateForceCheckDc(1)).toBe(11);
    expect(calculateForceCheckDc(5)).toBe(15);
  });
});
