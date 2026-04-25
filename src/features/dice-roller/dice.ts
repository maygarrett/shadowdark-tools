export type DiceExpression = string;

export function isDiceExpression(value: string): value is DiceExpression {
  return value.trim().length > 0;
}
