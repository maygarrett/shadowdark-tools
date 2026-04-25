import { useParams } from "react-router-dom";

export function CharacterSheetPage() {
  const { characterId } = useParams();

  return (
    <section>
      <header className="page-header">
        <h1>Character Sheet</h1>
        <p>Character sheet placeholder for {characterId ?? "unknown character"}.</p>
      </header>
      <div className="placeholder-panel">
        <p>Calculated sheet values are not implemented yet.</p>
      </div>
    </section>
  );
}
