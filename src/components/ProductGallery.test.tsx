// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ProductGallery, { Modal } from "./ProductGallery";
import { productMedia, type Photo } from "../media";
const photo = (kind: "bottle" | "box"): Photo => ({
  path: `images/whisky/test-${kind}.png`,
  label: kind === "bottle" ? "Butelka" : "Opakowanie",
  kind,
  author: "Autor testowy",
  source: "https://example.test/source",
  license: "Licencja testowa",
  licenseUrl: "https://example.test/license",
});
beforeEach(() => {
  productMedia.products.blue = [photo("bottle"), photo("box")];
});
afterEach(() => {
  cleanup();
  delete productMedia.products.blue;
  document.body.style.overflow = "";
});
describe("Galeria produktu — kontrolowane zasoby testowe, nie fotografie do publikacji", () => {
  it("wybiera osobną fotografię opakowania, zachowując nazwę edycji", () => {
    render(<ProductGallery product="blue" />);
    const image = screen.getByAltText("Johnnie Walker Blue Label — Butelka");
    expect(image.getAttribute("src")).toContain(
      "images/whisky/test-bottle.png",
    );
    expect(image.getAttribute("width")).toBe("700");
    expect(image.getAttribute("height")).toBe("900");
    fireEvent.click(
      screen.getByRole("button", { name: "Opakowanie" }),
    );
    expect(
      screen
        .getByAltText("Johnnie Walker Blue Label — Opakowanie")
        .getAttribute("src"),
    ).toContain("test-box.png");
    expect(screen.getByText("Autor testowy").getAttribute("href")).toBe(
      "https://example.test/source",
    );
  });
  it("otwiera powiększenie, zamyka je klawiszem Escape i przywraca przewijanie", () => {
    render(<ProductGallery product="blue" />);
    fireEvent.click(screen.getByRole("button", { name: /Powiększ zdjęcie/ }));
    expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBe("true");
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });
  it("błąd pliku usuwa uszkodzony obraz; brak obrazów nie podmienia edycji", () => {
    render(<ProductGallery product="blue" />);
    fireEvent.error(screen.getByAltText("Johnnie Walker Blue Label — Butelka"));
    fireEvent.error(
      screen.getByAltText("Johnnie Walker Blue Label — Opakowanie"),
    );
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Nie udało się wczytać fotografii")).toBeTruthy();
    expect(screen.getByText("Blue Label")).toBeTruthy();
  });
  it("zmiana produktu resetuje błąd i nie zachowuje zdjęcia innej whisky", () => {
    const { rerender } = render(<ProductGallery product="blue" />);
    rerender(<ProductGallery product="swing" />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Swing")).toBeTruthy();
  });
  it("Escape zamyka tylko wierzchnie powiększenie, zachowując pokój aukcyjny", () => {
    render(
      <Modal
        title="Pokój aukcyjny"
        onClose={() => {
          throw Error("Zamknięto niewłaściwy modal");
        }}
      >
        <ProductGallery product="blue" />
      </Modal>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Powiększ zdjęcie/ }));
    expect(screen.getAllByRole("dialog")).toHaveLength(2);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("dialog", { name: "Pokój aukcyjny" })).toBeTruthy();
  });
});
