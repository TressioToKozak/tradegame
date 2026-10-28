import { describe, it, expect, afterEach } from "vitest";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  readdir,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import {
  importJohnnieWalker,
  buildMarket,
} from "../scripts/import-johnnie-walker.mjs";
const temp = [];
const write = async (root, path, value) => {
  await mkdir(resolve(root, path, ".."), { recursive: true });
  await writeFile(resolve(root, path), JSON.stringify(value, null, 2) + "\n");
};
async function fixture() {
  const base = await mkdtemp(resolve(tmpdir(), "jw-import-test-"));
  temp.push(base);
  const source = resolve(base, "source"),
    target = resolve(base, "game");
  await mkdir(resolve(source, "public/bottles"), { recursive: true });
  await mkdir(resolve(target, "src"), { recursive: true });
  const records = [
    {
      id: "jw-black",
      brand: "Johnnie Walker",
      name: "Black Label",
      volume: 700,
      abv: 40,
      age: 12,
      category: "Klasyka",
      image: "/bottles/black.png",
    },
    {
      id: "jw-double",
      brand: "Johnnie Walker",
      name: "Double Black",
      volume: 700,
      abv: 40,
      age: null,
      category: "Klasyka",
      image: "/bottles/double.png",
    },
    {
      id: "jw-historic",
      brand: "Johnnie Walker",
      name: "Swing 1970s",
      volume: 750,
      abv: null,
      age: null,
      category: "Kolekcjonerska",
      image: "/bottles/historic.png",
    },
    {
      id: "jw-son",
      brand: "John Walker & Sons",
      name: "King George V",
      volume: 700,
      abv: 43,
      category: "Edycja specjalna",
      image: "/bottles/son.png",
    },
    {
      id: "ardbeg",
      brand: "Ardbeg",
      name: "Johnnie Walker file name is not a brand filter",
      image: "/bottles/johnnie-walker.png",
    },
  ];
  for (const r of records)
    await sharp({
      create: { width: 20, height: 40, channels: 3, background: "#ab8033" },
    })
      .png()
      .toFile(resolve(source, "public", "." + r.image));
  await write(source, "src/catalog.json", records);
  await write(source, "src/prices.json", {
    "jw-black": {
      amount: 20,
      currency: "EUR",
      market: "NL",
      kind: "retail",
      volumeMl: 700,
      sourceUrl: "https://example.test/black",
      checkedAt: "2026-10-19",
    },
  });
  await write(target, "src/catalog-data.json", [
    {
      id: "black",
      brand: "Johnnie Walker",
      name: "Johnnie Walker Black Label",
      volumeMl: 700,
      abv: 40,
      category: "standard",
      market: { referenceRetailCents: 3000 },
    },
    {
      id: "double",
      name: "Johnnie Walker Double Black",
      volumeMl: 1000,
      abv: 40,
      category: "standard",
      market: { referenceRetailCents: 4500 },
    },
  ]);
  await write(target, "src/product-media.json", {
    products: {},
    collection: [],
  });
  await write(target, "data/johnnie-walker/mapping-overrides.json", {
    "jw-black": "black",
  });
  return { sourceRoot: source, targetRoot: target, records };
}
async function hashes(root) {
  const out = {};
  async function walk(path) {
    for (const e of await readdir(path, { withFileTypes: true })) {
      const p = resolve(path, e.name);
      if (e.isDirectory()) await walk(p);
      else
        out[p.slice(root.length)] = createHash("sha256")
          .update(await readFile(p))
          .digest("hex");
    }
  }
  await walk(root);
  return out;
}
afterEach(async () => {
  await Promise.all(
    temp.splice(0).map((p) => rm(p, { recursive: true, force: true })),
  );
});
describe("Powtarzalny import katalogu i rzeczywistych zasobów", () => {
  it("filtruje markę, zachowuje ID i rozdziela 700/1000 ml bez dotykania innych marek", async () => {
    const f = await fixture(),
      r = await importJohnnieWalker(f);
    expect(r.selectedRecords).toBe(3);
    expect(r.added).toBe(2);
    expect(r.updated).toBe(1);
    expect(r.images).toBe(3);
    const c = JSON.parse(
      await readFile(resolve(f.targetRoot, "src/catalog-data.json"), "utf8"),
    );
    expect(c.map((w) => w.id)).toEqual([
      "black",
      "double",
      "jw-double",
      "jw-historic",
    ]);
    expect(c.find((w) => w.id === "double").volumeMl).toBe(1000);
    expect(c.find((w) => w.id === "jw-double").volumeMl).toBe(700);
    expect(c.find((w) => w.id === "jw-historic").abv).toBeNull();
    expect(c.find((w) => w.id === "jw-historic").releaseYear).toBeUndefined();
    const paths = await readdir(
      resolve(f.targetRoot, "public/images/whisky/imported"),
    );
    expect(paths).toHaveLength(3);
    expect(paths).not.toContain("ardbeg.webp");
  });
  it("drugi import jest identyczny bajtowo i nie dodaje kopii", async () => {
    const f = await fixture();
    await importJohnnieWalker(f);
    const before = await hashes(f.targetRoot);
    const r = await importJohnnieWalker(f);
    expect(r.added).toBe(0);
    expect(r.updated).toBe(3);
    expect(await hashes(f.targetRoot)).toEqual(before);
  });
  it("dry-run nie zapisuje ani katalogu, ani fotografii", async () => {
    const f = await fixture(),
      before = await hashes(f.targetRoot);
    const r = await importJohnnieWalker({ ...f, dryRun: true });
    expect(r.images).toBe(3);
    expect(await hashes(f.targetRoot)).toEqual(before);
  });
  it("brak pliku przerywa import przed zmianą katalogu", async () => {
    const f = await fixture();
    await rm(resolve(f.sourceRoot, "public/bottles/historic.png"));
    const before = await hashes(f.targetRoot);
    await expect(importJohnnieWalker(f)).rejects.toThrow(
      "brakujące/uszkodzone",
    );
    expect(await hashes(f.targetRoot)).toEqual(before);
  });
  it("odrzuca wyjście poza katalog butelek i kolizje wariantów", async () => {
    const f = await fixture();
    f.records[0].image = "/bottles/../outside.png";
    await write(f.sourceRoot, "src/catalog.json", f.records);
    await expect(importJohnnieWalker(f)).rejects.toThrow("Niedozwolona");
    f.records[0].image = "/bottles/black.png";
    await write(f.sourceRoot, "src/catalog.json", f.records);
    await write(f.targetRoot, "data/johnnie-walker/mapping-overrides.json", {
      "jw-double": "double",
    });
    await expect(importJohnnieWalker(f)).rejects.toThrow("Niezgodne parametry");
  });
  it("odrzuca duplikaty źródła i dwa mapowania do jednego produktu", async () => {
    const f = await fixture();
    await write(f.sourceRoot, "src/catalog.json", [...f.records, f.records[0]]);
    await expect(importJohnnieWalker(f)).rejects.toThrow("Duplikaty");
    await write(f.sourceRoot, "src/catalog.json", f.records);
    await write(f.targetRoot, "data/johnnie-walker/mapping-overrides.json", {
      "jw-black": "black",
      "jw-double": "black",
    });
    await expect(importJohnnieWalker(f)).rejects.toThrow("Dwie edycje");
  });
  it("linię John Walker & Sons dodaje wyłącznie jawną opcją", async () => {
    const f = await fixture();
    const r = await importJohnnieWalker({ ...f, includeWalkerSons: true });
    expect(r.selectedRecords).toBe(4);
    expect(r.images).toBe(4);
    const c = JSON.parse(
      await readFile(resolve(f.targetRoot, "src/catalog-data.json"), "utf8"),
    );
    expect(c.some((w) => w.id === "jw-son")).toBe(true);
    expect(c.some((w) => w.brand === "Ardbeg")).toBe(false);
  });
  it("przedział aukcyjny wykorzystuje wyłącznie zgodne sprzedane butelki", () => {
    const r = { volume: 700, abv: 46, category: "Edycja specjalna" };
    const q = {
      amount: 500,
      currency: "EUR",
      kind: "auction-result",
      market: "auction",
      volumeMl: 700,
      exchangeRate: 1.2,
      checkedAt: "2026-10-19",
      sourceUrl: "https://example.test/sold",
    };
    const obs = (priceGBP, volume = 700) => ({
      priceGBP,
      confirmedVolumeMl: volume,
      confirmedAbv: 46,
      source: "https://example.test/sold",
      sourceSha256: "hash",
    });
    const m = buildMarket(r, q, {
      observations: [obs(400), obs(500), obs(900, 750)],
    });
    expect(m.auctionMinCents).toBe(48000);
    expect(m.auctionMaxCents).toBe(60000);
    expect(m.retailCents).toBeNull();
    expect(m.sampleCount).toBe(2);
    const single = buildMarket(r, q, { observations: [obs(400)] });
    expect(single.auctionMinCents).toBeNull();
    expect(single.observedAuctionCents).toBe(50000);
    expect(single.pricingNeedsReview).toBe(true);
    const uncertain = buildMarket(
      r,
      { ...q, referenceOnly: true },
      { observations: [obs(400)] },
    );
    expect(uncertain.lastVerified).toBeNull();
    expect(uncertain.referenceKind).toBe("game-balance");
  });
});
