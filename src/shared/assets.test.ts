import { describe, expect, it } from "vitest";
import { resolvePublicAssetPath } from "./assets";

describe("resolvePublicAssetPath", () => {
  it("prefixes public asset paths with the configured base URL", () => {
    expect(
      resolvePublicAssetPath(
        "images/ruleset/species/duros.png",
        "/shadowdark-tools/",
      ),
    ).toBe("/shadowdark-tools/images/ruleset/species/duros.png");
  });

  it("accepts legacy leading-slash public asset paths", () => {
    expect(
      resolvePublicAssetPath(
        "/images/ruleset/species/duros.png",
        "/shadowdark-tools/",
      ),
    ).toBe("/shadowdark-tools/images/ruleset/species/duros.png");
  });

  it("works when the app is served from the domain root", () => {
    expect(resolvePublicAssetPath("images/ruleset/species/duros.png", "/")).toBe(
      "/images/ruleset/species/duros.png",
    );
  });

  it("leaves external and data URLs unchanged", () => {
    expect(
      resolvePublicAssetPath(
        "https://example.com/images/ruleset/species/duros.png",
        "/shadowdark-tools/",
      ),
    ).toBe("https://example.com/images/ruleset/species/duros.png");
    expect(
      resolvePublicAssetPath("data:image/png;base64,abc", "/shadowdark-tools/"),
    ).toBe("data:image/png;base64,abc");
    expect(resolvePublicAssetPath("blob:https://example.com/id", "/shadowdark-tools/")).toBe(
      "blob:https://example.com/id",
    );
  });
});
