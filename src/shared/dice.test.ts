import { describe, expect, it } from "vitest";
import {
  evaluateDiceExpression,
  isDiceExpression,
  parseDiceExpression,
} from "./dice";

function sequenceRandom(values: number[]): () => number {
  let index = 0;

  return () => {
    const value = values[index];
    index += 1;
    return value;
  };
}

describe("dice utilities", () => {
  it("parses dice expressions without modifiers", () => {
    expect(parseDiceExpression("1d20")).toEqual({
      count: 1,
      sides: 20,
      modifier: 0,
    });
    expect(parseDiceExpression("3d6")).toEqual({
      count: 3,
      sides: 6,
      modifier: 0,
    });
  });

  it("parses dice expressions with positive and negative modifiers", () => {
    expect(parseDiceExpression("1d8+2")).toEqual({
      count: 1,
      sides: 8,
      modifier: 2,
    });
    expect(parseDiceExpression("2d6-1")).toEqual({
      count: 2,
      sides: 6,
      modifier: -1,
    });
  });

  it("accepts uppercase d and surrounding whitespace", () => {
    expect(parseDiceExpression(" 2D6 + 1 ")).toEqual({
      count: 2,
      sides: 6,
      modifier: 1,
    });
  });

  it("rejects invalid dice expressions", () => {
    expect(isDiceExpression("")).toBe(false);
    expect(isDiceExpression("d20")).toBe(false);
    expect(isDiceExpression("1d1")).toBe(false);
    expect(isDiceExpression("1d20+")).toBe(false);
  });

  it("evaluates dice expressions with deterministic random values", () => {
    const result = evaluateDiceExpression(
      "2d6-1",
      sequenceRandom([0, 0.999]),
    );

    expect(result.rolls).toEqual([1, 6]);
    expect(result.total).toBe(6);
  });

  it("throws if the random function returns a value outside the expected range", () => {
    expect(() => evaluateDiceExpression("1d20", () => 1)).toThrow(
      /random function/i,
    );
  });
});
