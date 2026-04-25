import { useParams } from "react-router-dom";
import { getCharacter } from "../../characters/storage";

export function CharacterSheetPage() {
  const { characterId } = useParams();
  const character = characterId ? getCharacter(characterId) : undefined;

  return (
    <section>
      <header className="page-header">
        <h1>Character Sheet</h1>
        <p>
          Character sheet placeholder for{" "}
          {character?.name ?? characterId ?? "unknown character"}.
        </p>
      </header>
      <div className="placeholder-panel">
        <p>Calculated sheet values are not implemented yet.</p>
      </div>
    </section>
  );
}
