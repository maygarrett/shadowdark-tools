import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the character library route", () => {
    render(
      <MemoryRouter
        initialEntries={["/characters"]}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /character library/i }),
    ).toBeInTheDocument();
  });
});
