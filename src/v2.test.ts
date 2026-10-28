import { describe, it, expect } from "vitest";
import {
  createGame,
  advance,
  bid,
  bidStep,
  cash,
  held,
  makeAuction,
  MINUTE,
  DAY,
  migrateGame,
  setPace,
  supplierClaim,
  type State,
} from "./engine";
import { EventQueue } from "./scheduler";
import { catalog } from "./catalog";
import { photosFor } from "./media";
const now = Date.UTC(2026, 9, 27, 12);
const drain = (s: State, target: number) => {
  let attempts = 0;
  while (s.now < target && attempts++ < 20) advance(s, target);
  expect(s.now).toBe(target);
};
describe("Ciągły rynek 3.0", () => {
  it("startuje z szesnastoma aukcjami pełnego katalogu i 35 rywalami", () => {
    const s = createGame(now, 42);
    expect(s.auctions).toHaveLength(16);
    expect(s.people.filter((p) => p.role === "bidder")).toHaveLength(35);
    for (const a of s.auctions) {
      expect(catalog.some((w) => w.id === a.product)).toBe(true);
      expect(a.end - now).toBeGreaterThanOrEqual(45000);
    }
    expect(new Set(s.auctions.map((a) => a.end)).size).toBe(16);
    expect(s.auctions.some((a) => !photosFor(a.product).length)).toBe(true);
  });
  it("przez godzinę regularnie uzupełnia aukcje, bez pustego rynku i bez przekroczenia 20", () => {
    const s = createGame(now, 42);
    let samples = 0,
      healthy = 0;
    for (let t = now + MINUTE; t <= now + 60 * MINUTE; t += MINUTE) {
      advance(s, t);
      const active = s.auctions.filter((a) => a.status === "active").length;
      expect(active).toBeGreaterThanOrEqual(6);
      expect(active).toBeLessThanOrEqual(20);
      if (active >= 12) healthy++;
      samples++;
    }
    expect(healthy / samples).toBeGreaterThan(0.7);
    expect(s.serial).toBeGreaterThan(300);
  });
  it("każda cena ma właściwy krok, a limit chroni także w chwili rejestracji", () => {
    expect([9000, 20000, 50000, 150000].map(bidStep)).toEqual([
      500, 1000, 2000, 5000,
    ]);
    const s = createGame(now, 12),
      a = s.auctions[1];
    expect(bid(s, a.id, "player", a.price + bidStep(a.price) - 1)).toContain(
      "Minimalne",
    );
    a.playerLimit = a.price + 1000;
    expect(bid(s, a.id, "player", a.price + 2000)).toContain("limit");
    expect(cash(s)).toBe(500000);
  });
  it("różne tempo nie zmienia cen, budżetów ani istniejących ofert", () => {
    const s = createGame(now, 20);
    const a = s.auctions[0];
    bid(s, a.id, "player", a.price + bidStep(a.price));
    const snapshot = {
      price: a.price,
      end: a.end,
      budget: s.people.map((p) => p.budget),
      cash: cash(s),
      held: held(s),
    };
    setPace(s, "Intensywne");
    expect({
      price: a.price,
      end: a.end,
      budget: s.people.map((p) => p.budget),
      cash: cash(s),
      held: held(s),
    }).toEqual(snapshot);
  });
  it("20 aukcji i wielu rywali nie narusza wspólnych budżetów", () => {
    const s = createGame(now, 100);
    for (let i = 0; i < 4; i++) makeAuction(s, i, now + (i + 3) * MINUTE);
    expect(s.auctions.filter((a) => a.status === "active")).toHaveLength(20);
    advance(s, now + 20 * MINUTE);
    for (const p of s.people) {
      expect(p.budget).toBeGreaterThanOrEqual(0);
      expect(p.reserved).toBeGreaterThanOrEqual(0);
      expect(p.reserved).toBeLessThanOrEqual(p.budget);
    }
    expect(new Set(s.ledger.map((l) => l.id)).size).toBe(s.ledger.length);
  });
  it("kilkudniowy powrót ma ograniczoną historię i nie rozlicza nic ponownie", () => {
    const s = createGame(now, 80);
    const start = performance.now();
    drain(s, now + 3 * DAY);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(10000);
    expect(s.events.every((e) => !e.done)).toBe(true);
    expect(s.events.length).toBeLessThan(1000);
    expect(s.auctions.length).toBeLessThan(90);
    for (const p of s.people) expect(p.memory.length).toBeLessThanOrEqual(120);
    const before = structuredClone(s);
    advance(s, s.now);
    expect(s).toEqual(before);
    console.info(
      `Odtwarzanie 3 dni: ${Math.round(elapsed)} ms, ${s.events.length} przyszłych zdarzeń`,
    );
  });
  it("kolejka zachowuje kolejność rejestracji przy identycznym terminie", () => {
    const q = new EventQueue(
      [3, 1, 2].map((id) => ({
        id,
        at: 100,
        type: "market",
        ref: "world",
        done: false,
      })),
    );
    expect([q.pop()?.id, q.pop()?.id, q.pop()?.id]).toEqual([1, 2, 3]);
  });
  it("migracja wersji 1 zachowuje gotówkę, transakcje, butelki i terminy", () => {
    const original = createGame(now, 12);
    original.items.push({
      id: "old-stock",
      product: "brora",
      cost: 50000,
      condition: 90,
      status: "listed",
      price: 60000,
      views: 3,
      interested: [],
    });
    const old = JSON.parse(JSON.stringify(original));
    old.version = 1;
    delete old.pace;
    old.people = old.people.filter((p: any) => !p.id.startsWith("bidder-"));
    const ledger = structuredClone(old.ledger),
      items = structuredClone(old.items),
      auctions = structuredClone(old.auctions);
    const s = migrateGame(old);
    expect(s.version).toBe(2);
    expect(s.ledger).toEqual(ledger);
    expect(s.items).toEqual(items);
    expect(s.auctions).toEqual(auctions);
    expect(cash(s)).toBe(500000);
    expect(s.events.filter((e) => e.type === "market")).toHaveLength(1);
  });
  it("ugoda za niezgodny stan jest jednokrotna i koryguje koszt zapasu", () => {
    const s = createGame(now);
    s.items.push({
      id: "damaged",
      product: "swing",
      cost: 10000,
      condition: 80,
      expectedCondition: 100,
      status: "stock",
      price: 0,
      views: 0,
      interested: [],
    });
    supplierClaim(s, "damaged");
    expect(cash(s)).toBe(501000);
    expect(s.items[0].cost).toBe(9000);
    supplierClaim(s, "damaged");
    expect(cash(s)).toBe(501000);
  });
  it("katalog zawiera ponad 50 odrębnych edycji ze stabilnymi identyfikatorami", () => {
    expect(catalog.length).toBeGreaterThanOrEqual(50);
    expect(new Set(catalog.map((w) => w.id)).size).toBe(catalog.length);
    expect(new Set(catalog.map((w) => w.name)).size).toBe(catalog.length);
  });
});
