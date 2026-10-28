import { test, expect } from "@playwright/test";
async function start(page: any) {
  await page.goto("./");
  await page.getByRole("button", { name: "NOWA GRA", exact: true }).click();
  await page.getByRole("button", { name: "ROZPOCZNIJ GRĘ" }).click();
  await page.getByRole("button", { name: "Pomiń wprowadzenie" }).click();
}
async function development(page: any) {
  await page.getByRole("button", { name: "Więcej", exact: true }).click();
  await page
    .getByRole("button", { name: "Rozwój sklepu", exact: true })
    .click();
}
test("menu gry: nieruchoma fotografia, monogram i konfiguracja dopiero po Nowa gra", async ({
  page,
}) => {
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: "NOWA GRA", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: "Monogram JWC" })).toBeVisible();
  await expect(page.getByLabel("Tempo gry", { exact: true })).toHaveCount(0);
  const photo = page.locator(".menu-photography img");
  await expect
    .poll(() =>
      photo.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
    )
    .toBe(true);
  await photo.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/v3-menu-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "NOWA GRA", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Nowa gra" });
  await expect(dialog).toBeVisible();
  await dialog
    .getByLabel("Tempo gry", { exact: true })
    .selectOption("Intensywne");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "NOWA GRA", exact: true }),
  ).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/v3-menu-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("rozwój kosztuje pieniądze, zmienia pojemność i pozostaje po odświeżeniu", async ({
  page,
}) => {
  await start(page);
  await expect(page.locator(".header-cash")).toContainText("5000,00");
  await expect(page.locator(".live-shortcut")).toContainText("16 aukcji");
  await page.screenshot({
    path: "test-results/v3-dashboard.png",
    fullPage: true,
  });
  await development(page);
  await page
    .locator(".upgrade-card")
    .filter({
      has: page.getByRole("heading", { name: "Lepszy magazyn", exact: true }),
    })
    .getByRole("button")
    .click();
  await expect(page.locator(".header-cash")).toContainText("4820,00");
  await expect(page.locator(".progress-hero")).toContainText("/36 miejsc");
  await expect(page.locator(".achievement.earned")).toContainText(
    "Krok naprzód",
  );
  await page.screenshot({
    path: "test-results/v3-development.png",
    fullPage: true,
  });
  await expect(page.locator(".save-state")).toContainText("Postęp zapisany");
  await page.reload();
  await page.getByRole("button", { name: "KONTYNUUJ GRĘ" }).click();
  await development(page);
  await expect(page.locator(".progress-hero")).toContainText("/36 miejsc");
  await expect(page.locator(".header-cash")).toContainText("4820,00");
});
test("kontrolki rynku, klawiatura, animacje i mniejszy ruch na telefonie", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page);
  await page.getByRole("button", { name: "Aukcje", exact: true }).click();
  await page.getByRole("button", { name: /Filtry i sortowanie/ }).click();
  const select = page.getByLabel("Sortowanie", { exact: true });
  await select.selectOption("Cena rosnąco");
  expect(await select.evaluate((e) => getComputedStyle(e).appearance)).toBe(
    "none",
  );
  const check = page.getByLabel("Tylko obserwowane");
  await check.focus();
  await page.keyboard.press("Space");
  await expect(check).toBeChecked();
  await expect(page.locator(".auction-grid .auction-card")).toHaveCount(0);
  await page.keyboard.press("Space");
  await expect(check).not.toBeChecked();
  await expect(page.locator(".auction-card").first()).toBeVisible();
  await expect(page.getByText("Poznaj edycje", { exact: false })).toHaveCount(
    0,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator(".auction-card")
      .first()
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  await page.screenshot({
    path: "test-results/v3-market-mobile.png",
    fullPage: true,
  });
});

test("przełącznik animacji i tooltip obsługują klawiaturę", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "USTAWIENIA", exact: true }).click();
  const toggle = page.getByRole("switch", { name: "Uproszczone animacje" });
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toBeChecked();
  await page.getByRole("button", { name: "Zamknij okno" }).click();
  await page.reload();
  await page.getByRole("button", { name: "USTAWIENIA", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "Uproszczone animacje" }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Zamknij okno" }).click();
  await page.getByRole("button", { name: "NOWA GRA", exact: true }).click();
  await page.getByRole("button", { name: "ROZPOCZNIJ GRĘ" }).click();
  await page.getByRole("button", { name: "Pomiń wprowadzenie" }).click();
  await page.getByRole("button", { name: "Aukcje", exact: true }).click();
  await page
    .getByRole("button", { name: "Wejdź do licytacji" })
    .first()
    .click();
  await page.getByRole("button", { name: "Jak liczymy pełny koszt?" }).focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.getByRole("button", { name: "Jak liczymy pełny koszt?" }).click();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: /Aukcja/ })).toBeVisible();
});
