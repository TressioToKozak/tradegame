import { test, expect } from "@playwright/test";
import {
  createGame,
  advance,
  bid,
  totalCost,
  MINUTE,
  type State,
} from "../src/engine";
function fixture() {
  const s = createGame(Date.now(), 42),
    a = s.auctions[0];
  s.auctions = [a];
  s.events = [];
  Object.assign(a, {
    product: "blue",
    price: 17000,
    fee: 0.12,
    shipping: 1500,
    leader: null,
    end: s.now + 2 * MINUTE,
    limits: { p0: 21000 },
    bids: [],
  });
  s.events.push({
    id: ++s.serial,
    at: a.end,
    type: "close",
    ref: a.id,
    done: false,
  });
  return { s, a };
}
async function openGame(page: any, s: State) {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Importuj zapis", exact: true })
    .click();
  await page.locator("input[type=file]").setInputFiles({
    name: "test.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(s)),
  });
  await expect(
    page.getByRole("heading", { name: "Twój salon whisky", exact: true }),
  ).toBeVisible();
}
async function openRoom(page: any) {
  await page.getByRole("button", { name: "Aukcje", exact: true }).click();
  await page
    .getByRole("button", { name: "Wejdź do licytacji" })
    .first()
    .click();
  return page.getByRole("dialog", { name: /Aukcja/ });
}
test("proxy wymaga potwierdzenia, przebija minimalnie, przetrwa restart i zatrzymuje się na 200 €", async ({
  page,
}) => {
  test.setTimeout(40000);
  const { s, a } = fixture();
  s.events.push(
    {
      id: ++s.serial,
      at: s.now + 8000,
      type: "bid",
      ref: a.id,
      actor: "p0",
      amount: 19000,
      done: false,
    },
    {
      id: ++s.serial,
      at: s.now + 12000,
      type: "bid",
      ref: a.id,
      actor: "p0",
      amount: 21000,
      done: false,
    },
  );
  await openGame(page, s);
  let room = await openRoom(page);
  await room
    .getByLabel("Automatyczna licytacja — maksymalna oferta (€)")
    .fill("200");
  await room.getByRole("button", { name: "Aktywuj", exact: true }).click();
  await expect(room.locator(".room-price>strong")).toContainText("170,00");
  await expect(room.locator(".proxy-confirm")).toContainText("239,00");
  await room.getByRole("button", { name: "Potwierdź aktywację" }).click();
  await expect(room.locator(".room-price>strong")).toContainText("180,00");
  await expect(room.locator(".proxy-status")).toContainText("Automat aktywny");
  await expect(page.locator(".save-state")).toContainText("Postęp zapisany");
  await page.reload();
  await page.getByRole("button", { name: "KONTYNUUJ GRĘ" }).click();
  room = await openRoom(page);
  await expect(room.locator(".room-price>strong")).toContainText("200,00", {
    timeout: 12000,
  });
  await expect(room.locator(".proxy-status")).toContainText(
    "Przebity ponad limit",
    { timeout: 12000 },
  );
  await expect(room.locator(".room-price>strong")).toContainText("210,00");
  await page.screenshot({
    path: "test-results/v31-proxy-desktop.png",
    fullPage: true,
  });
  await room.getByRole("button", { name: "Wyłącz", exact: true }).click();
  await expect(room.locator(".proxy-heading")).toContainText("WYŁĄCZONA");
});
for (const outcome of ["won", "lost", "unsold"] as const)
  test(`wynik ${outcome}: brak kontrolek ofert i automatu`, async ({
    page,
  }) => {
    const s = createGame(Date.now() - 60000, 42),
      a = s.auctions[0];
    s.auctions = [a];
    s.events = [];
    Object.assign(a, {
      product: "blue",
      price: 17000,
      fee: 0.12,
      shipping: 1500,
      end: s.now + 30000,
      limits: { p0: 30000 },
      bids: [],
      leader: null,
    });
    s.events.push({
      id: ++s.serial,
      at: a.end,
      type: "close",
      ref: a.id,
      done: false,
    });
    if (outcome !== "unsold") bid(s, a.id, "player", 18000);
    if (outcome === "lost") bid(s, a.id, "p0", 20000);
    advance(s, a.end);
    await openGame(page, s);
    await page.getByRole("button", { name: "Aukcje", exact: true }).click();
    await page.getByText("Ostatnie zakończone aukcje", { exact: true }).click();
    await page.getByRole("button", { name: "Wynik aukcji" }).click();
    const room = page.getByRole("dialog", { name: /Aukcja/ });
    await expect(room.locator("#bid-amount")).toHaveCount(0);
    await expect(room.locator("#proxy-limit")).toHaveCount(0);
    await expect(
      room.getByRole("button", { name: "LICYTUJ", exact: true }),
    ).toHaveCount(0);
    await expect(room.locator(".auction-result")).toContainText(
      outcome === "won"
        ? "WYGRAŁEŚ!"
        : outcome === "lost"
          ? "AUKCJA ZAKOŃCZONA"
          : "AUKCJA ZAKOŃCZONA BEZ SPRZEDAŻY",
    );
    if (outcome === "won") {
      await expect(room.locator(".cost-breakdown")).toContainText(
        String(totalCost(a) / 100).replace(".", ","),
      );
      await expect(room.locator(".delivery-status")).toContainText("W drodze");
    }
    if (outcome === "lost")
      await expect(room.locator(".auction-result")).toContainText("180,00");
    await expect(room).not.toContainText("Prowadzi Brak ofert");
    await page.screenshot({
      path: `test-results/v31-result-${outcome}.png`,
      fullPage: true,
    });
    await room
      .getByRole("button", { name: "Wróć do aktywnych aukcji" })
      .click();
    await expect(room).toHaveCount(0);
  });
test("stary limit pozostaje wyłączony, a dane edycji nie zdradzają wyceny", async ({
  page,
}) => {
  const { s, a } = fixture();
  a.playerLimit = 20000;
  delete a.proxyActive;
  await openGame(page, s);
  const room = await openRoom(page);
  await expect(room.locator(".proxy-heading")).toContainText("WYŁĄCZONA");
  await expect(room.locator(".live-history")).toContainText(
    "Nie złożono ofert",
  );
  await room.getByText("Poznaj ten egzemplarz", { exact: true }).click();
  for (const forbidden of [
    "Popyt",
    "płynność",
    "przedział aukcyjny",
    "oferta detaliczna",
    "Rodzaj źródła",
    "Data wyniku",
    "Weryfikacja w repozytorium",
    "Źródło ceny",
    "Źródło fotografii",
    "Autor niepodany",
    "Prawa zastrzeżone",
    "Referencja",
  ])
    await expect(room).not.toContainText(forbidden);
  await expect(room.locator(".photo-stage img")).toBeVisible();
  await room.getByRole("button", { name: "Zamknij okno" }).click();
  await page.getByRole("button", { name: "Więcej", exact: true }).click();
  await page.getByRole("button", { name: "Pomoc i ustawienia" }).click();
  await page
    .getByRole("button", { name: "Fotografie i autorzy", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Informacje o fotografiach" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Źródło", exact: true }).first(),
  ).toBeVisible();
});
test("cel dnia jest nagradzany po rzeczywistej kontroli paczki i zapisuje odbiór", async ({
  page,
}) => {
  const { s } = fixture();
  s.items.push({
    id: "parcel",
    product: "blue",
    cost: 12000,
    condition: 100,
    status: "inspect",
    price: 0,
    views: 0,
    interested: [],
  });
  await openGame(page, s);
  await page.getByRole("button", { name: "Magazyn", exact: true }).click();
  await page
    .getByRole("button", { name: "Otwórz paczkę", exact: true })
    .click();
  const parcel = page.getByRole("dialog", { name: "Otwieranie przesyłki" });
  await parcel
    .getByRole("button", { name: "Otwórz paczkę", exact: true })
    .click();
  await parcel.getByRole("button", { name: "Przyjmij do magazynu" }).click();
  await page.getByRole("button", { name: "Pulpit", exact: true }).click();
  await page.locator(".salon-daily > summary").click();
  await page
    .getByRole("button", { name: "Odbierz 15 PD", exact: true })
    .click();
  await expect(page.locator(".daily-board")).toContainText("1/3 odebrane");
  await expect(page.locator(".header-cash")).toContainText("5000,00");
  await expect(page.locator(".save-state")).toContainText("Postęp zapisany");
  await page.reload();
  await page.getByRole("button", { name: "KONTYNUUJ GRĘ" }).click();
  await expect(page.locator(".daily-board")).toContainText("1/3 odebrane");
});
for (const width of [320, 390, 768, 1440])
  test(`układ ${width}px: zdjęcia, nawigacja i automat mieszczą się w ekranie`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");
    await page.getByRole("button", { name: "NOWA GRA", exact: true }).waitFor();
    await page.screenshot({
      path: `test-results/v31-menu-${width}.png`,
      fullPage: true,
    });
    const { s } = fixture();
    await openGame(page, s);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 500));
    await expect.poll(async () => page.locator(".store-header").evaluate(
      (el) => Math.round(el.getBoundingClientRect().top),
    )).toBe(0);
    const geometry = await page.evaluate(() => ({
      headerBottom: document.querySelector(".store-header")!.getBoundingClientRect().bottom,
      navTop: document.querySelector(".store-nav")!.getBoundingClientRect().top,
      navBottom: document.querySelector(".store-nav")!.getBoundingClientRect().bottom,
      height: innerHeight,
    }));
    if (width > 600) expect(Math.abs(geometry.navTop - geometry.headerBottom)).toBeLessThanOrEqual(1);
    else expect(Math.abs(geometry.navBottom - geometry.height)).toBeLessThanOrEqual(1);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `test-results/v31-dashboard-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Aukcje", exact: true }).click();
    await page.getByRole("button", { name: /Filtry i sortowanie/ }).click();
    await page.getByLabel("Tylko obserwowane").check();
    await page.getByLabel("Tylko obserwowane").uncheck();
    const room = await openRoom(page);
    await room
      .getByLabel("Automatyczna licytacja — maksymalna oferta (€)")
      .fill("200");
    await room.getByRole("button", { name: "Aktywuj", exact: true }).click();
    await expect(
      room.getByRole("button", { name: "Potwierdź aktywację" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await room.evaluate(
        (r: HTMLElement) => r.scrollWidth <= r.clientWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/v31-auction-${width}.png`,
      fullPage: true,
    });
  });
