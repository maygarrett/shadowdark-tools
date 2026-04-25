import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import { routes } from "../routes";

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <p className="sidebar__title">Shadowdark Tools</p>
        <nav className="sidebar__nav">
          <NavLink
            to={routes.characterLibrary}
            className={({ isActive }) =>
              isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
            }
          >
            Characters
          </NavLink>
          <NavLink
            to={routes.newCharacter}
            className={({ isActive }) =>
              isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
            }
          >
            New Character
          </NavLink>
          <NavLink
            to={routes.diceRoller}
            className={({ isActive }) =>
              isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
            }
          >
            Dice Roller
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
