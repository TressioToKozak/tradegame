import { expect, test } from "@playwright/test";
import { createGame, advance, list, MINUTE, DAY } from "../src/engine";
import { productMedia } from "../src/media";

async function importState(page: any, state: ReturnType<typeof createGame>) {
  await page.goto("./");
  await page.getByRole("button", { name: /Pomoc i ustawienia/ }).click();
  await page
    .getByRole("button", { name: "Importuj zapis", exact: true })
    .click();
  await page.locator("input[type=file]").setInputFiles({
    name: "zapis.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(state)),
  });
  await expect(
    page.getByRole("heading", { name: /Dobre historie/ }),
  ).toBeVisible();
}
function storeFixture() {
  const now = Date.now();
  const s = createGame(now - 60 * MINUTE, 42);
  s.items.push({
    id: "test-stock",
    product: "blue",
    cost: 14000,
    condition: 100,
    status: "stock",
    price: 0,
    views: 0,
    interested: [],
  });
  list(s, "test-stock", 19000);
  s.people
    .filter((p) => p.role === "customer")
    .forEach((p) => (p.responseStyle = "fast"));
  // Force a daytime visit without relying on the machine's wall-clock hour.
  s.now = Date.UTC(2026, 9, 27, 10);
  s.events = [];
  for (const [i, p] of s.people.filter((p) => p.role === "customer").entries())
    s.events.push({
      id: ++s.serial,
      at: s.now + (i + 1) * 1000,
      type: "visit",
      ref: p.id,
      done: false,
    });
  advance(s, s.now + 10000);
  const shift = now - s.now;
  s.now += shift;
  s.started += shift;
  s.events.forEach((e) => (e.at += shift));
  s.auctions.forEach((a) => (a.end += shift));
  s.threads.forEach((t) => {
    t.expires += shift;
    t.messages.forEach((m) => (m.at += shift));
  });
  s.feed.forEach((f) => (f.at += shift));
  return s;
}
test("nowa gra, zegar, prawdziwe oferty NPC, własna oferta i zapis", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await page.getByRole("button", { name: "NOWA GRA", exact: true }).click();
  await page.getByRole("button", { name: "Pomiń wprowadzenie" }).click();
  await expect(
    page.getByText("5000,00", { exact: false }).first(),
  ).toBeVisible();
  const state = createGame(Date.now(), 42);
  state.auctions.forEach((a, i) => (a.end = state.now + (3 + i) * MINUTE));
  state.events = state.events.filter((e) => e.type !== "think");
  state.auctions[0].limits.p0 = 20000;
  state.events.push({
    id: ++state.serial,
    at: state.now + 1500,
    type: "think",
    ref: state.auctions[0].id,
    actor: "p0",
    done: false,
  });
  state.events
    .filter((e) => e.type === "close")
    .forEach((e) => {
      e.at = state.auctions.find((a) => a.id === e.ref)!.end;
    });
  await page.getByRole("button", { name: "Menu główne" }).click();
  page.on("dialog", (d) => d.accept());
  await importState(page, state);
  await page
    .getByRole("button", { name: "Wejdź do licytacji" })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: /Aukcja/ });
  const before = await dialog.locator(".room-timer").innerText();
  await page.waitForTimeout(2100);
  expect(await dialog.locator(".room-timer").innerText()).not.toBe(before);
  await expect(dialog.getByText("Collector1978 podnosi ofertę")).toBeVisible();
  await dialog.getByLabel("Twoja oferta (€)").fill("150");
  await dialog.getByRole("button", { name: "LICYTUJ", exact: true }).click();
  await expect(
    dialog.getByText("Ty — Twoja oferta została przyjęta"),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Zamknij okno" }).click();
  await page.reload();
  await page.getByRole("button", { name: "KONTYNUUJ", exact: true }).click();
  await page
    .getByRole("button", { name: "Wejdź do licytacji" })
    .first()
    .click();
  await expect(
    page.getByText("Ty — Twoja oferta została przyjęta"),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("komunikator odracza decyzję klienta i zachowuje ją po przeładowaniu", async ({
  page,
}) => {
  await importState(page, storeFixture());
  await page.getByRole("button", { name: /^Wiadomości/ }).click();
  await page.getByText("Wybierz konkretne działanie").click();
  await page.getByRole("button", { name: /^Akceptuj/ }).click();
  await expect(
    page.getByText("Wiadomość wysłana. Klient zapoznaje się z ofertą."),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "KONTYNUUJ" }).click();
  await page.getByRole("button", { name: /^Wiadomości/ }).click();
  await expect(
    page.getByText("Wiadomość wysłana. Klient zapoznaje się z ofertą."),
  ).toBeVisible();
  await expect(page.locator(".chat-bubble.own")).toHaveCount(1);
});
test("otwieranie paczki wymaga przyjęcia do magazynu", async ({ page }) => {
  const s = createGame(Date.now(), 42);
  s.items.push({
    id: "parcel",
    product: "swing",
    cost: 8000,
    condition: 100,
    status: "inspect",
    price: 0,
    views: 0,
    interested: [],
  });
  await importState(page, s);
  await page.getByRole("button", { name: "Magazyn", exact: true }).click();
  await page
    .getByRole("button", { name: "Otwórz paczkę", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Otwieranie przesyłki" });
  await dialog
    .getByRole("button", { name: "Otwórz paczkę", exact: true })
    .click();
  await expect(
    dialog.getByText("Kontrola zakończona · stan 100/100"),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Przyjmij do magazynu" }).click();
  await expect(page.getByText("W magazynie", { exact: true })).toBeVisible();
});
test("wygrana aukcja pokazuje prawdziwy wynik i pełny koszt", async ({
  page,
}) => {
  const s = createGame(Date.now() - 10 * MINUTE, 42);
  const a = s.auctions[0];
  a.leader = "player";
  a.price = 10000;
  a.fee = 0.12;
  a.shipping = 1500;
  s.events = s.events.filter((e) => e.type !== "think");
  await importState(page, s);
  await expect(
    page.getByRole("heading", { name: "Wygrana aukcja!" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("dialog", { name: "Wygrana aukcja" })
      .getByText("127,00", { exact: false }),
  ).toBeVisible();
});
test("zachowuje finanse, dostępność przycisków i układ mobilny", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await page.getByRole("button", { name: "NOWA GRA", exact: true }).click();
  await page.getByRole("button", { name: "Pomiń wprowadzenie" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Więcej", exact: true }).click();
  await page.getByRole("button", { name: "Finanse", exact: true }).click();
  await expect(page.getByText("Kapitał początkowy")).toBeVisible();
  await page.getByRole("button", { name: "Pulpit", exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});
test("produkcja działa offline w podfolderze repozytorium", async ({
  page,
  context,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "NOWA GRA", exact: true }).click();
  await page.getByRole("button", { name: "Pomiń wprowadzenie" }).click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.getByRole("button", { name: "KONTYNUUJ" }).click();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "KONTYNUUJ" }).click();
  await expect(
    page.getByRole("heading", { name: /Dobre historie/ }),
  ).toBeVisible();
});
test("przypisane fotografie ładują się z /tradegame/ i można je powiększyć", async ({
  page,
}) => {
  const s = createGame(Date.now(), 42);
  s.auctions[0].product = "blue";
  s.auctions[0].end = s.now + 60000;
  await importState(page, s);
  const photo = page
    .locator(".auction-card")
    .first()
    .locator(".photo-stage img");
  await expect(photo).toBeVisible();
  await expect
    .poll(() =>
      photo.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: /Powiększ zdjęcie/ })
    .first()
    .click();
  await expect(page.locator(".zoom-photo")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".zoom-photo")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    )
    .toBe(true);
});
test("wszystkie przypisane fotografie się ładują, filtry działają, limit jest zapisywany", async ({
  page,
}) => {
  const state = createGame(Date.now(), 42);
  const template = state.auctions[0];
  state.auctions = Object.keys(productMedia.products).map((id, i) => ({
    ...structuredClone(template),
    id: `photo-${i}`,
    product: id,
    end: state.now + (i + 5) * MINUTE,
    limits: {},
    bids: [],
  }));
  state.events = [];
  await importState(page, state);
  await page
    .getByRole("button", { name: "Aukcje na żywo", exact: true })
    .click();
  await expect(page.locator(".auction-card")).toHaveCount(
    state.auctions.length,
  );
  const images = page.locator(".auction-card .photo-stage img");
  await expect(images).toHaveCount(state.auctions.length);
  for (let i = 0; i < state.auctions.length; i++) {
    const img = images.nth(i);
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        img.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  for (const photo of [
    ...Object.values(productMedia.products).flat(),
    ...productMedia.collection,
  ]) {
    const decoded = await page.evaluate(async (path) => {
      const image = new Image();
      image.src = "./" + path;
      await image.decode();
      return image.naturalWidth > 0;
    }, photo.path);
    expect(decoded).toBe(true);
  }
  await page.getByLabel("Kategoria", { exact: true }).selectOption("Vintage");
  await expect(page.locator(".auction-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Wejdź do licytacji" }).click();
  await page.getByRole("button", { name: "Obserwuj", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Obserwowana", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Twój opcjonalny limit ceny młotkowej (€)").fill("40");
  await page.getByRole("button", { name: "Zapisz limit" }).click();
  await page.getByRole("button", { name: "Zamknij okno" }).click();
  await page.getByLabel("Tylko obserwowane").check();
  await expect(page.locator(".auction-card")).toHaveCount(1);
  await page.screenshot({
    path: "test-results/photographed-market.png",
    fullPage: true,
  });
});
test("oryginalny zapis wersji 1 można wyeksportować przed migracją", async ({
  page,
}) => {
  await page.goto("./");
  const state = createGame(Date.now(), 42) as any;
  state.version = 1;
  delete state.pace;
  state.people = state.people.filter((p: any) => !p.id.startsWith("bidder-"));
  await page.getByRole("button", { name: "NOWA GRA", exact: true }).waitFor();
  await page.evaluate(async (old: any) => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open("jw-collection-store");
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("games", "readwrite");
        tx.objectStore("games").put({ id: "main", state: old });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  }, state);
  await page.reload();
  await expect(
    page.getByRole("dialog", { name: "Aktualizacja zapisu" }),
  ).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Pobierz zapis wersji 1" }).click();
  expect((await downloaded).suggestedFilename()).toContain("przed-migracja");
  await page.getByRole("button", { name: "Przenieś do wersji 2" }).click();
  await expect(
    page.getByRole("dialog", { name: "Aktualizacja zapisu" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "KONTYNUUJ" }).click();
  await expect(
    page.getByText("5000,00", { exact: false }).first(),
  ).toBeVisible();
});

test("anti-sniping: dwa przedłużenia, odświeżenie i jedno rozliczenie NPC", async ({
  page,
}) => {
  test.setTimeout(65000);
  const now = Date.now(),
    state = createGame(now, 42),
    a = state.auctions[0];
  a.product = "blue";
  a.price = 19000;
  a.fee = 0.12;
  a.shipping = 1500;
  a.end = now + 8000;
  a.leader = null;
  a.limits = { p0: 21000 };
  a.bids = [];
  state.auctions = [a];
  state.people.find((p) => p.id === "p0")!.budget = 65000;
  state.events = [
    { id: ++state.serial, type: "close", at: a.end, ref: a.id, done: false },
    {
      id: ++state.serial,
      type: "think",
      at: now + 18000,
      ref: a.id,
      actor: "p0",
      done: false,
    },
  ];
  await importState(page, state);
  await page
    .getByRole("button", { name: "Wejdź do licytacji" })
    .first()
    .click();
  let room = page.getByRole("dialog", { name: /Aukcja/ });
  await room.getByLabel("Twoja oferta (€)").fill("200");
  await room.getByRole("button", { name: "LICYTUJ", exact: true }).click();
  await expect(room.locator(".extension-banner")).toContainText("+15 SEKUND");
  await expect(page.locator(".save-state")).toContainText("Postęp zapisany");
  await page.reload();
  await page.getByRole("button", { name: "KONTYNUUJ" }).click();
  await page
    .getByRole("button", { name: "Wejdź do licytacji" })
    .first()
    .click();
  room = page.getByRole("dialog", { name: /Aukcja/ });
  await page.waitForTimeout(Math.max(0, now + 9000 - Date.now()));
  await expect(room.locator(".room-timer")).not.toContainText("Zakończona");
  await expect(
    room
      .locator(".live-history")
      .getByText(/Collector1978 podnosi ofertę.*przedłużona/),
  ).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(Math.max(0, now + 24000 - Date.now()));
  await expect(room.locator(".room-timer")).not.toContainText("Zakończona");
  await expect(room.locator(".room-timer")).toContainText("Zakończona", {
    timeout: 20000,
  });
  await expect(page.locator(".save-state")).toContainText("Postęp zapisany");
  const result = await page.evaluate(
    async () =>
      await new Promise<any>((resolve, reject) => {
        const r = indexedDB.open("jw-collection-store");
        r.onsuccess = () => {
          const db = r.result;
          const tx = db.transaction("games", "readonly");
          const req = tx.objectStore("games").get("main");
          req.onsuccess = () => resolve(req.result.state);
          req.onerror = () => reject(req.error);
          tx.oncomplete = () => db.close();
        };
      }),
  );
  expect(result.auctions[0].extensions).toHaveLength(2);
  expect(result.people.find((p: any) => p.id === "p0").budget).toBe(39980);
  expect(
    result.people
      .find((p: any) => p.id === "p0")
      .memory.filter((m: any) => m.kind === "won"),
  ).toHaveLength(1);
  expect(result.ledger).toHaveLength(1);
});
