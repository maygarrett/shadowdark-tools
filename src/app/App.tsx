import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { CharacterBuilderPage } from "../features/character-builder/BuilderPage";
import { CharacterLibraryPage } from "../features/character-library/CharacterLibraryPage";
import { CharacterSheetPage } from "../features/character-sheet/CharacterSheetPage";
import { DiceRollerPage } from "../features/dice-roller/DiceRollerPanel";

export function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/characters" replace />} />
        <Route path="/characters" element={<CharacterLibraryPage />} />
        <Route path="/characters/new" element={<CharacterBuilderPage />} />
        <Route path="/characters/:characterId/edit" element={<CharacterBuilderPage />} />
        <Route path="/characters/:characterId" element={<CharacterSheetPage />} />
        <Route path="/dice" element={<DiceRollerPage />} />
      </Routes>
    </AppLayout>
  );
}
