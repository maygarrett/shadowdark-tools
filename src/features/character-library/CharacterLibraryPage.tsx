import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { routes } from "../../app/routes";
import { parseImportedCharacterJson } from "../../characters/importExport";
import {
  deleteCharacter,
  importCharacter,
  listCharacters,
} from "../../characters/storage";

export function CharacterLibraryPage() {
  const [characters, setCharacters] = useState(() => listCharacters());
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function importSelectedFile(file: File): Promise<void> {
    setImportMessage("");
    setImportError("");

    try {
      const importedCharacter = importCharacter(
        parseImportedCharacterJson(await readFileAsText(file)),
      );

      setCharacters(listCharacters());
      setImportMessage(`Imported ${importedCharacter.name}.`);
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "Import failed. Choose a valid character JSON file.",
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function deleteSavedCharacter(characterId: string, characterName: string): void {
    setImportMessage("");
    setImportError("");

    if (
      !globalThis.confirm(
        `Delete ${characterName}? This cannot be undone.`,
      )
    ) {
      return;
    }

    deleteCharacter(characterId);
    setCharacters(listCharacters());
    setImportMessage(`Deleted ${characterName}.`);
  }

  return (
    <section>
      <header className="page-header">
        <h1>Character Library</h1>
        <p>Saved local characters.</p>
      </header>
      <div className="page-actions">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          Import Character
        </button>
        <input
          accept="application/json,.json"
          aria-label="Import character JSON"
          className="visually-hidden"
          ref={fileInputRef}
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              void importSelectedFile(file);
            }
          }}
        />
      </div>
      {importMessage ? (
        <p className="form-success" role="status">
          {importMessage}
        </p>
      ) : null}
      {importError ? (
        <p className="form-error" role="alert">
          {importError}
        </p>
      ) : null}
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
            <div
              className="character-list__item"
              key={character.id}
            >
              <Link
                className="character-list__link"
                to={routes.characterSheet(character.id)}
              >
                <strong>{character.name}</strong>
                <span>Level {character.level}</span>
              </Link>
              <button
                className="character-list__delete"
                type="button"
                onClick={() =>
                  deleteSavedCharacter(character.id, character.name)
                }
              >
                Delete {character.name}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      resolve(String(reader.result ?? ""));
    });
    reader.addEventListener("error", () => {
      reject(new Error("Could not read import file."));
    });
    reader.readAsText(file);
  });
}
