import { useState } from "react";
import {
  evaluateDiceExpression,
  type DiceRollResult,
  type RollMode,
} from "../../shared/dice";

type RollHistoryEntry = DiceRollResult & {
  id: string;
  label: string;
  rolledAt: Date;
};

const quickDice = ["1d4", "1d6", "1d8", "1d10", "1d12", "1d20"];

export function DiceRollerPage() {
  const [expression, setExpression] = useState("1d20");
  const [label, setLabel] = useState("Manual Roll");
  const [mode, setMode] = useState<RollMode>("normal");
  const [history, setHistory] = useState<RollHistoryEntry[]>([]);
  const [error, setError] = useState("");

  function roll(expressionToRoll = expression, labelToUse = label): void {
    try {
      const result = evaluateDiceExpression(expressionToRoll, Math.random, mode);
      setHistory((currentHistory) => [
        {
          ...result,
          id: `${Date.now()}-${currentHistory.length}`,
          label: labelToUse.trim() || expressionToRoll,
          rolledAt: new Date(),
        },
        ...currentHistory,
      ]);
      setExpression(expressionToRoll);
      setError("");
    } catch (rollError) {
      setError(
        rollError instanceof Error ? rollError.message : "Enter a valid dice expression.",
      );
    }
  }

  return (
    <section>
      <header className="page-header">
        <h1>Dice Roller</h1>
        <p>Roll common dice or custom expressions.</p>
      </header>
      <div className="dice-panel">
        <div className="form-grid">
          <label>
            Label
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </label>
          <label>
            Expression
            <input
              value={expression}
              onChange={(event) => setExpression(event.target.value)}
            />
          </label>
          <label>
            d20 mode
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as RollMode)}
            >
              <option value="normal">Normal</option>
              <option value="advantage">Advantage</option>
              <option value="disadvantage">Disadvantage</option>
            </select>
          </label>
        </div>

        {error ? <p className="form-error" role="alert">{error}</p> : null}

        <div className="quick-dice">
          {quickDice.map((dieExpression) => (
            <button
              key={dieExpression}
              type="button"
              onClick={() => roll(dieExpression, dieExpression)}
            >
              Roll {dieExpression}
            </button>
          ))}
          <button type="button" onClick={() => roll()}>
            Roll Expression
          </button>
        </div>

        <RollHistory history={history} />
      </div>
    </section>
  );
}

function RollHistory({ history }: { history: RollHistoryEntry[] }) {
  if (history.length === 0) {
    return <p className="muted">No rolls yet.</p>;
  }

  return (
    <section className="roll-history" aria-label="Roll history">
      <h2>Roll History</h2>
      <ul>
        {history.map((entry) => (
          <li key={entry.id}>
            <strong>{formatRollSummary(entry)}</strong>
            <span>
              Dice: [{entry.rolls.join(", ")}]
              {entry.mode !== "normal" ? `, kept ${entry.keptRolls[0]}` : ""}
              {entry.modifier ? `, modifier ${formatSigned(entry.modifier)}` : ""}
            </span>
            <time dateTime={entry.rolledAt.toISOString()}>
              {entry.rolledAt.toLocaleTimeString()}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatRollSummary(entry: RollHistoryEntry): string {
  const diceText = entry.count === 1 ? `d${entry.sides}` : `${entry.count}d${entry.sides}`;

  return `${entry.label}: ${diceText} ${formatSigned(entry.modifier)} = ${entry.total}`;
}

function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}
