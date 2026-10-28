// @vitest-environment jsdom
import { it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PhotoCredits from "./PhotoCredits";
import ProductGallery from "./ProductGallery";
import { productMedia } from "../media";
afterEach(cleanup);
it("zdjęcie nie pokazuje metadanych, a osobne informacje zachowują źródła", () => {
  const { unmount } = render(<ProductGallery product="blue" />);
  expect(screen.queryByText("Źródło fotografii")).toBeNull();
  expect(screen.queryByText(productMedia.products.blue[0].author)).toBeNull();
  unmount();
  render(<PhotoCredits onClose={() => {}} />);
  expect(
    screen.getByRole("dialog", { name: "Informacje o fotografiach" }),
  ).toBeTruthy();
  expect(
    screen.getAllByText(productMedia.products.blue[0].author).length,
  ).toBeGreaterThan(0);
  expect(
    screen
      .getAllByRole("link", { name: "Źródło" })
      .map((link) => link.getAttribute("href")),
  ).toContain(productMedia.products.blue[0].source);
});
