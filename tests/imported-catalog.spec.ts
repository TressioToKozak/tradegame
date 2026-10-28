import { test, expect } from "@playwright/test";
import sourceCatalog from "../data/johnnie-walker/source-catalog.json" with { type: "json" };
import mapping from "../data/johnnie-walker/id-map.json" with { type: "json" };
import { createGame, MINUTE } from "../src/engine";
import { photosFor } from "../src/media";
import { whisky } from "../src/catalog";
const batches = Array.from(
  { length: Math.ceil(sourceCatalog.length / 20) },
  (_, i) => sourceCatalog.slice(i * 20, i * 20 + 20),
);
for (const [batch, records] of batches.entries())
  test(`fotografie importu ${batch + 1}/${batches.length}: rzeczywiste karty ${records[0].id} — ${records.at(-1)!.id}`, async ({
    page,
  }) => {
    const s = createGame(Date.now(), 42),
      template = s.auctions[0];
    s.auctions = records.map((r, i) => ({
      ...structuredClone(template),
      id: `import-${i}`,
      product: mapping.entries[r.id as keyof typeof mapping.entries].gameId,
      createdAt: s.now,
      end: s.now + (10 + i) * MINUTE,
      limits: {},
      bids: [],
      leader: null,
    }));
    s.events = [];
    await page.goto("./");
    await page
      .getByRole("button", { name: "Importuj zapis", exact: true })
      .click();
    await page
      .locator("input[type=file]")
      .setInputFiles({
        name: "fotografie.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(s)),
      });
    await expect(
      page.getByRole("region", { name: "Interaktywny salon whisky", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Aukcje", exact: true })
      .click();
    await expect(page.locator(".auction-card")).toHaveCount(records.length);
    for (const [i, r] of records.entries()) {
      const id = mapping.entries[r.id as keyof typeof mapping.entries].gameId,
        card = page.locator(".auction-card").nth(i),
        img = card.locator(".photo-stage img");
      await img.scrollIntoViewIfNeeded();
      await expect(img).toBeVisible();
      expect(await img.getAttribute("src")).toContain(photosFor(id)[0].path);
      expect(await img.getAttribute("alt")).toContain(whisky(id).name);
      await expect
        .poll(() =>
          img.evaluate(async (i: HTMLImageElement) => {
            await i.decode();
            return i.complete && i.naturalWidth > 0 && i.naturalHeight > 0;
          }),
        )
        .toBe(true);
    }
    if (batch === 0)
      await page.screenshot({
        path: "test-results/import-first-20.png",
        fullPage: true,
      });
  });
test("menu nie pobiera całej biblioteki; cache zdjęć jest uzupełniany na żądanie", async ({
  page,
}) => {
  const requested: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/images/whisky/imported/")) requested.push(r.url());
  });
  await page.goto("./");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(300);
  expect(requested).toHaveLength(0);
  await page.evaluate(
    async (paths) => {
      let next = 0;
      const worker = async () => {
        while (next < paths.length) {
          const p = paths[next++];
          const response = await fetch("./" + p);
          if (!response.ok) throw Error(p);
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
    },
    sourceCatalog
      .slice(0, 90)
      .map(
        (r) =>
          photosFor(
            mapping.entries[r.id as keyof typeof mapping.entries].gameId,
          )[0].path,
      ),
  );
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const names = (await caches.keys()).filter((n) =>
          n.endsWith("-photos"),
        );
        return names.length
          ? (await (await caches.open(names[0])).keys()).length
          : 0;
      }),
    )
    .toBeGreaterThan(0);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const names = (await caches.keys()).filter((n) =>
          n.endsWith("-photos"),
        );
        return (await (await caches.open(names[0])).keys()).length;
      }),
    )
    .toBe(80);
});
