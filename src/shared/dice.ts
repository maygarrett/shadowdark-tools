export type DiceExpression = `${number}d${number}` | `${number}d${number}${"+" | "-"}${number}`;

export type ParsedDiceExpression = {
  count: number;
  sides: number;
  modifier: number;
};

export type DiceRollResult = ParsedDiceExpression & {
  expression: string;
  rolls: number[];
  keptRolls: number[];
  total: number;
  mode: RollMode;
};

export type RollMode = "normal" | "advantage" | "disadvantage";

const diceExpressionPattern = /^(\d+)d(\d+)(?:([+-])(\d+))?$/i;

export function parseDiceExpression(expression: string): ParsedDiceExpression {
  const normalizedExpression = expression.replace(/\s+/g, "").toLowerCase();
  const match = diceExpressionPattern.exec(normalizedExpression);

  if (!match) {
    throw new Error(`Invalid dice expression: ${expression}`);
  }

  const count = Number(match[1]);
  const sides = Number(match[2]);
  const modifierValue = match[4] ? Number(match[4]) : 0;
  const modifier = match[3] === "-" ? -modifierValue : modifierValue;

  if (!Number.isSafeInteger(count) || count < 1) {
    throw new Error("Dice count must be at least 1.");
  }

  if (!Number.isSafeInteger(sides) || sides < 2) {
    throw new Error("Dice sides must be at least 2.");
  }

  return { count, sides, modifier };
}

export function isDiceExpression(value: string): value is DiceExpression {
  try {
    parseDiceExpression(value);
    return true;
  } catch {
    return false;
  }
}

export function evaluateDiceExpression(
  expression: string,
  random: () => number = Math.random,
  mode: RollMode = "normal",
): DiceRollResult {
  const parsedExpression = parseDiceExpression(expression);
  const isD20WithOneDie = parsedExpression.count === 1 && parsedExpression.sides === 20;
  const shouldRollTwice =
    isD20WithOneDie && (mode === "advantage" || mode === "disadvantage");
  const rolls = Array.from({ length: shouldRollTwice ? 2 : parsedExpression.count }, () =>
    rollDie(parsedExpression.sides, random),
  );
  const keptRolls = shouldRollTwice
    ? [mode === "advantage" ? Math.max(...rolls) : Math.min(...rolls)]
    : rolls;
  const total =
    keptRolls.reduce((sum, roll) => sum + roll, 0) + parsedExpression.modifier;

  return {
    ...parsedExpression,
    expression: expression.replace(/\s+/g, "").toLowerCase(),
    rolls,
    keptRolls,
    total,
    mode,
  };
}

function rollDie(sides: number, random: () => number): number {
  const randomValue = random();

  if (randomValue < 0 || randomValue >= 1) {
    throw new Error("Random function must return a value from 0 up to, but not including, 1.");
  }

  return Math.floor(randomValue * sides) + 1;
}
