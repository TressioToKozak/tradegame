import { describe, it, expect } from "vitest";
import { catalog } from "./catalog";
import {
  createGame,
  bid,
  advance,
  cash,
  held,
  totalCost,
  chooseMarketProduct,
  MINUTE,
  type State,
} from "./engine";
import { parseSave } from "./storage";
import { photosFor } from "./media";
const now = Date.UTC(2026, 9, 27, 12);
function auction(seconds = 8) {
  const s = createGame(now, 42),
    a = s.auctions[0];
  a.product = "blue";
  a.price = 19000;
  a.fee = 0.12;
  a.shipping = 1500;
  a.end = now + seconds * 1000;
  a.leader = null;
  a.limits = {};
  a.bids = [];
  s.events = [
    { id: ++s.serial, at: a.end, type: "close", ref: a.id, done: false },
  ];
  return { s, a };
}
describe("Anti-sniping: rzeczywisty termin i jednokrotne rozliczenie", () => {
  it("8 sekund: gracz przedłuża, po wznowieniu NPC przedłuża ponownie, wygrywa raz", () => {
    const { s, a } = auction();
    expect(bid(s, a.id, "player", 20000)).toContain("zaakceptowana");
    expect(a.end).toBe(now + 23000);
    expect(held(s)).toBe(totalCost(a));
    advance(s, now + 8000);
    expect(a.status).toBe("active");
    expect(cash(s)).toBe(500000);
    const restored = parseSave(JSON.stringify(s));
    const b = restored.auctions.find((b) => b.id === a.id)!;
    advance(restored, now + 18000);
    b.limits.p0 = 50000;
    const rival = restored.people.find((p) => p.id === "p0")!;
    rival.budget = 500000;
    const budget = rival.budget;
    expect(bid(restored, b.id, "p0", 21000)).toContain("zaakceptowana");
    expect(b.end).toBe(now + 38000);
    expect(b.extensions).toHaveLength(2);
    expect(held(restored)).toBe(0);
    advance(restored, now + 23000);
    expect(b.status).toBe("active");
    advance(restored, now + 38000);
    expect(b.status).toBe("closed");
    expect(b.leader).toBe("p0");
    expect(rival.budget).toBe(budget - totalCost(b));
    expect(cash(restored)).toBe(500000);
    const after = structuredClone(restored);
    advance(restored, restored.now);
    expect(restored).toEqual(after);
  });
  it("własne podbicie, błędna kwota i brak budżetu nie przedłużają", () => {
    const { s, a } = auction();
    const original = a.end;
    expect(bid(s, a.id, "player", 19001)).toContain("przebicie");
    expect(a.end).toBe(original);
    expect(bid(s, a.id, "player", 600000)).toContain("budżetu");
    expect(a.end).toBe(original);
    bid(s, a.id, "player", 20000);
    const extended = a.end;
    expect(bid(s, a.id, "player", 21000)).toContain("prowadzisz");
    expect(a.end).toBe(extended);
    expect(a.extensions).toHaveLength(1);
  });
  it("próg obejmuje dokładnie 10 sekund, a nie 11", () => {
    const x = auction(10);
    bid(x.s, x.a.id, "player", 20000);
    expect(x.a.end).toBe(now + 25000);
    const y = auction(11);
    bid(y.s, y.a.id, "player", 20000);
    expect(y.a.end).toBe(now + 11000);
  });
  it("oferta w chwili końca jest spóźniona nawet bez przetworzenia close", () => {
    const { s, a } = auction();
    s.now = a.end;
    expect(bid(s, a.id, "player", 20000)).toContain("spóźniona");
    expect(a.extensions).toBeUndefined();
  });
  it("stare zdarzenie close ze starszego zapisu nie zamyka przed nowym terminem", () => {
    const { s, a } = auction();
    a.end = now + 23000;
    advance(s, now + 8000);
    expect(a.status).toBe("active");
    expect(
      s.events.filter((e) => e.type === "close" && !e.done && e.at === a.end),
    ).toHaveLength(1);
    advance(s, a.end);
    expect(a.status).toBe("closed");
  });
  it("wygrana gracza po przedłużeniu ma jeden zakup, jedną prowizję i transport", () => {
    const { s, a } = auction();
    bid(s, a.id, "player", 20000);
    advance(s, a.end);
    expect(cash(s)).toBe(500000 - totalCost(a));
    expect(s.items).toHaveLength(1);
    expect(s.ledger.filter((l) => l.ref === a.id)).toHaveLength(3);
    advance(s, s.now + 1000);
    expect(s.ledger.filter((l) => l.ref === a.id)).toHaveLength(3);
  });
  it("snajper przestawia oczekiwaną decyzję na nowy koniec aukcji", () => {
    const { s, a } = auction();
    const p = s.people.find((p) => p.strategy === "snipe")!;
    p.budget = 100000;
    a.limits[p.id] = 30000;
    s.events.push({
      id: ++s.serial,
      type: "think",
      at: a.end - 2000,
      actor: p.id,
      ref: a.id,
      done: false,
    });
    bid(s, a.id, "player", 20000);
    const thoughts = s.events.filter(
      (e) => !e.done && e.type === "think" && e.actor === p.id,
    );
    expect(thoughts).toHaveLength(1);
    expect(thoughts[0].at).toBeGreaterThan(now + 8000);
    expect(thoughts[0].at).toBeLessThan(a.end);
  });
});
describe("Siedem edycji, model rynku i losowanie bez ukrywania braków fotografii", () => {
  it("aktualizuje trzy istniejące ID i dodaje cztery, bez duplikatu Red Rye", () => {
    for (const [id, price, rarity, volume, abv] of [
      ["red", 1900, 1, 700, 40],
      ["red-soul", 1900, 2, 700, 40],
      ["rye", 3500, 5, 700, 40],
      ["high-rye", 3500, 5, 750, 45],
      ["triple-cask", 6000, 5, 1000, 40],
      ["black-ruby", 3400, 2, 700, 40],
      ["sherry", 3500, 4, 700, 40],
    ] as const) {
      const w = catalog.find((w) => w.id === id)!;
      expect(w.market.referenceRetailCents).toBe(price);
      expect(w.market.rarity).toBe(rarity);
      expect(w.volumeMl).toBe(volume);
      expect(w.abv).toBe(abv);
    }
    expect(
      catalog.filter((w) => w.name.includes("Red Rye Finish")),
    ).toHaveLength(1);
    expect(catalog.find((w) => w.id === "rye")!.releaseYear).toBe(2016);
    expect(catalog.find((w) => w.id === "red-soul")!.releaseYear).toBe(2026);
  });
  it("wszystkie ceny są centami i nie udają niezależnie zweryfikowanych notowań", () => {
    for (const w of catalog) {
      expect(Number.isSafeInteger(w.value)).toBe(true);
      expect(w.market.rarity).toBeGreaterThanOrEqual(1);
      expect(w.market.rarity).toBeLessThanOrEqual(10);
      expect(w.market.demand).toBeGreaterThanOrEqual(0);
      expect(w.market.liquidity).toBeLessThanOrEqual(100);
      if (w.market.referenceKind === "game-balance")
        expect(w.market.lastVerified).toBeNull();
    }
    expect(catalog.find((w) => w.id === "high-rye")!.balanceNote).toContain(
      "nie jest to potwierdzona cena",
    );
  });
  it("powszechne i regionalne produkty mają różną częstotliwość, a braki zdjęć nie są filtrowane", () => {
    const s = createGame(now, 21);
    s.auctions = [];
    const counts: Record<string, number> = {};
    let missing = 0;
    for (let i = 0; i < 10000; i++) {
      const w = catalog[chooseMarketProduct(s)];
      counts[w.id] = (counts[w.id] ?? 0) + 1;
      if (!photosFor(w.id).length) missing++;
    }
    expect(counts.red).toBeGreaterThan(counts.honour);
    expect(counts.rye).toBeGreaterThan(counts["high-rye"]);
    expect(missing).toBeGreaterThan(0);
  });
  it("handlarze i kolekcjonerzy nie podbijają pospolitego Red Label do 100 €", () => {
    const s = createGame(now, 8);
    const a = s.auctions.find((a) => a.product === "red") ?? s.auctions[0];
    // All generated common-product private limits include fees and are near retail, not rarity-driven speculation.
    for (const lot of s.auctions.filter(
      (a) =>
        catalog.find((w) => w.id === a.product)!.market.availability ===
        "common",
    ))
      for (const limit of Object.values(lot.limits))
        if (limit > 0)
          expect(totalCost(lot, limit)).toBeLessThanOrEqual(
            Math.round(catalog.find((w) => w.id === lot.product)!.value * 1.06),
          );
  });
});

import { readFileSync, existsSync } from "node:fs";
import { productMedia } from "./media";
import { makeAuction, list } from "./engine";
describe("Kompletność raportu i rozdzielenie cech rynku", () => {
  it("każda pozycja ma właściwy lokalny plik albo występuje w pełnym raporcie braków", () => {
    const report = readFileSync(
      new URL("../MISSING_IMAGES.md", import.meta.url),
      "utf8",
    );
    for (const w of catalog) {
      const photos = productMedia.products[w.id] ?? [];
      if (!photos.length) expect(report.split("\n").filter(line=>line.startsWith("|")).map(line=>line.split("|")[1].trim())).toContain(w.id);
      else
        for (const photo of photos)
          expect(
            existsSync(new URL("../public/" + photo.path, import.meta.url)),
          ).toBe(true);
    }
  });
  it("partie różnią się prowizją, transportem i stanem bez zmiany finansów gracza", () => {
    const s = createGame(now, 42);
    for (let i = 0; i < 5; i++) makeAuction(s, i, s.now + 5 * MINUTE);
    expect(new Set(s.auctions.map((a) => a.fee)).size).toBeGreaterThan(1);
    expect(new Set(s.auctions.map((a) => a.shipping)).size).toBeGreaterThan(1);
    expect(s.auctions.some((a) => a.condition < 100)).toBe(true);
    expect(cash(s)).toBe(500000);
  });
  it("płynność zmienia faktyczne zapytania, niezależnie od rzadkości i ceny", () => {
    const w = catalog.find((w) => w.id === "blue")!,
      before = structuredClone(w.market);
    const run = () => {
      const s = createGame(now, 42);
      s.items.push({
        id: "liquidity-test",
        product: "blue",
        cost: 10000,
        condition: 100,
        status: "stock",
        price: 0,
        views: 0,
        interested: [],
      });
      list(s, "liquidity-test", 100);
      advance(s, now + 20 * MINUTE);
      return s;
    };
    try {
      w.market.demand = 100;
      w.market.liquidity = 0;
      const low = run();
      w.market.liquidity = 100;
      const high = run();
      expect(low.threads).toHaveLength(0);
      expect(high.threads.length).toBeGreaterThan(0);
      expect(w.market.rarity).toBe(before.rarity);
      expect(w.value).toBe(before.referenceRetailCents);
    } finally {
      w.market = before;
    }
  });
});
