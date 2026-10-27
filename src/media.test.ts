import { describe, it, expect } from "vitest";
import { assetUrl, productMedia } from "./media";
import { catalog } from "./catalog";
describe("Zdjęcia i GitHub Pages", () => {
  it("rozwiązuje ścieżki pod folderem repozytorium i przy bazie względnej", () => {
    expect(assetUrl("images/whisky/blue.webp", "/tradegame/")).toBe(
      "/tradegame/images/whisky/blue.webp",
    );
    expect(assetUrl("/images/whisky/blue.webp", "/tradegame")).toBe(
      "/tradegame/images/whisky/blue.webp",
    );
    expect(assetUrl("images/whisky/blue.webp", "./")).toBe(
      "./images/whisky/blue.webp",
    );
  });
  it("nie pozwala podstawić zewnętrznego hosta ani wyjść poza katalog", () => {
    expect(() => assetUrl("https://example.com/blue.webp")).toThrow();
    expect(() => assetUrl("images/whisky/../../secret")).toThrow();
  });
  it("przypisuje zdjęcia tylko do znanych edycji i wymaga metadanych licencji", () => {
    for (const [id, photos] of Object.entries(productMedia.products)) {
      expect(catalog.some((w) => w.id === id)).toBe(true);
      for (const p of photos) {
        expect(p.author).toBeTruthy();
        expect(p.license).toBeTruthy();
        expect(p.source).toMatch(/^https:/);
        expect(p.licenseUrl).toMatch(/^https:/);
      }
    }
  });
});
