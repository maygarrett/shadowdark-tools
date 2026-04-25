import { Link } from "react-router-dom";
import { routes } from "../../app/routes";
import { listCharacters } from "../../characters/storage";

export function CharacterLibraryPage() {
  const characters = listCharacters();

  return (
    <section>
      <header className="page-header">
        <h1>Character Library</h1>
        <p>Saved local characters.</p>
      </header>
      {characters.length === 0 ? (
        <div className="placeholder-panel">
          <p>No saved characters yet.</p>
          <Link className="text-link" to={routes.newCharacter}>
            Create a character
          </Link>
        </div>
      ) : (
        <div className="character-list">
          {characters.map((character) => (
            <Link
              className="character-list__item"
              key={character.id}
              to={routes.characterSheet(character.id)}
            >
              <strong>{character.name}</strong>
              <span>Level {character.level}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
