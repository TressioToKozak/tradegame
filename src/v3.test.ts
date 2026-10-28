import { describe, it, expect } from "vitest";
import {
  financials,
  makeAuction,
  createGame,
  advance,
  bid,
  cash,
  held,
  pack,
  ship,
  inspect,
  auctionDuration,
  deliveryDuration,
  MINUTE,
  DAY,
} from "./engine";
import {
  progress,
  earn,
  shopLevel,
  capacity,
  buyUpgrade,
  upgradeCost,
} from "./progression";
import { auctionRange, estimatedHammerValue } from "./market";
import { whisky, catalog } from "./catalog";
import { parseSave } from "./storage";
const now = Date.UTC(2026, 9, 28, 12);
describe("Rozwój sklepu i zachowanie postępu", () => {
  it("odzyskuje rozwój starszego zapisu bez zmiany pieniędzy, butelek ani terminów", () => {
    const s = createGame(now, 42);
    delete s.progression;
    s.auctions[0].status = "closed";
    s.auctions[0].leader = "player";
    const before = structuredClone({
      ledger: s.ledger,
      items: s.items,
      events: s.events,
      auctions: s.auctions,
    });
    expect(progress(s).xp).toBe(25);
    expect(progress(s).xp).toBe(25);
    expect({
      ledger: s.ledger,
      items: s.items,
      events: s.events,
      auctions: s.auctions,
    }).toEqual(before);
    const restored = parseSave(JSON.stringify(s));
    expect(progress(restored)).toEqual(progress(s));
  });
  it("wydaje wyłącznie wolną gotówkę i księguje każdy stopień jednokrotnie", () => {
    const s = createGame(now, 42),
      before = cash(s),
      cost = upgradeCost(s, "warehouse");
    buyUpgrade(s, "warehouse");
    expect(cash(s)).toBe(before - cost);
    expect(capacity(s)).toBe(36);
    expect(financials(s).profit).toBe(-cost);
    expect(progress(s).achievements).toContain("developer");
    buyUpgrade(s, "warehouse");
    buyUpgrade(s, "warehouse");
    const balance = cash(s);
    buyUpgrade(s, "warehouse");
    expect(cash(s)).toBe(balance);
    expect(capacity(s)).toBe(60);
    expect(new Set(s.ledger.map((l) => l.id)).size).toBe(s.ledger.length);
  });
  it("wymaga poziomu oraz uwzględnia blokady ofert przy zakupie ulepszeń", () => {
    const s = createGame(now, 42);
    expect(buyUpgrade(s, "website")).toContain("poziom");
    earn(s, "test-business", 100);
    expect(shopLevel(s)).toBe(2);
    const a = s.auctions[0];
    a.price = 425000;
    a.fee = 0.12;
    a.shipping = 1500;
    a.leader = "player";
    expect(cash(s) - held(s)).toBeLessThan(25000);
    expect(buyUpgrade(s, "contacts")).toContain("Brak");
    expect(progress(s).upgrades.contacts).toBe(0);
  });
  it("kontrola i jej PD nie mogą zostać powtórzone", () => {
    const s = createGame(now, 42);
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
    inspect(s, "parcel");
    const xp = progress(s).xp;
    expect(xp).toBe(10);
    inspect(s, "parcel");
    expect(progress(s).xp).toBe(xp);
  });
  it("ponownie sprawdza pojemność podczas rejestracji oferty", () => {
    const s = createGame(now, 42);
    for (let n = 0; n < 24; n++)
      s.items.push({
        id: "b" + n,
        product: "red",
        cost: 2000,
        condition: 100,
        status: "stock",
        price: 0,
        views: 0,
        interested: [],
      });
    const a = s.auctions[0];
    expect(bid(s, a.id, "player", a.price + 5000)).toContain("Magazyn");
    expect(a.leader).toBeNull();
    buyUpgrade(s, "warehouse");
    expect(bid(s, a.id, "player", a.price + 5000)).toContain("zaakceptowana");
  });
  it("ulepszone zabezpieczenie zmniejsza ryzyko, ale nie usuwa go", () => {
    let baseline = 0,
      improved = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const a = createGame(now, seed),
        b = structuredClone(a);
      for (const s of [a, b]) {
        s.orders.push({
          id: "risk",
          item: "unused",
          customer: "p5",
          total: 20000,
          status: "packing",
          packed: true,
          due: 0,
          returnUntil: 0,
          quality: 100,
          refund: 0,
        });
      }
      progress(b).upgrades.packing = 3;
      progress(b).upgrades.warehouse = 3;
      ship(a, "risk");
      ship(b, "risk");
      baseline += Number(a.orders[0].quality < 100);
      improved += Number(b.orders[0].quality < 100);
    }
    expect(baseline).toBeGreaterThan(improved);
    expect(improved).toBeGreaterThan(0);
  });
  it("kontakty mają zapisane pochodzenie partii i nie zmieniają istniejących aukcji", () => {
    const s = createGame(now, 42),
      original = structuredClone(s.auctions);
    progress(s).upgrades.contacts = 3;
    for (let i = 0; i < 30; i++)
      makeAuction(
        s,
        catalog.findIndex((w) => w.id === "brora"),
        now + 5 * MINUTE,
      );
    expect(s.auctions.slice(0, 16)).toEqual(original);
    const sourced = s.auctions.filter((a) => a.supplierContact);
    expect(sourced.length).toBeGreaterThan(0);
    for (const a of sourced)
      expect(a.country).toBe(
        a.supplierContact === "noor" ? "Holandia" : "Niemcy",
      );
    const restored = parseSave(JSON.stringify(s));
    expect(restored.auctions).toEqual(s.auctions);
  });
  it("odrzuca uszkodzone stopnie ulepszeń w imporcie", () => {
    const s = createGame(now, 42);
    progress(s).upgrades.packing = -1;
    expect(() => parseSave(JSON.stringify(s))).toThrow("Uszkodzony");
  });
  it("doręczenie przyznaje doświadczenie raz, również po odtworzeniu", () => {
    const s = createGame(now, 42);
    s.events = [];
    s.items.push({
      id: "sold",
      product: "blue",
      cost: 10000,
      condition: 100,
      status: "reserved",
      price: 19000,
      views: 0,
      interested: [],
    });
    s.orders.push({
      id: "order",
      item: "sold",
      customer: "p5",
      total: 19000,
      status: "packing",
      packed: false,
      due: 0,
      returnUntil: 0,
      quality: 100,
      refund: 0,
    });
    pack(s, "order");
    ship(s, "order");
    const due = s.orders[0].due;
    advance(s, due);
    expect(
      progress(s).awarded.filter((k) => k === "delivery:order"),
    ).toHaveLength(1);
    const restored = parseSave(JSON.stringify(s));
    const xp = progress(restored).xp;
    advance(restored, due + MINUTE);
    expect(progress(restored).xp).toBe(xp);
  });
});
describe("Tempo i ostrożny rynek", () => {
  it("różnicuje czasy aukcji i logistyki w granicach trybu dynamicznego", () => {
    const s = createGame(now, 5);
    for (let n = 0; n < 100; n++) {
      for (const id of ["red", "rye", "brora"]) {
        const idx = catalog.findIndex((w) => w.id === id),
          d = auctionDuration(s, idx) / MINUTE,
          r = whisky(id).rarity;
        const bounds = r >= 8 ? [6, 10] : r >= 5 ? [4, 6] : [2, 4];
        expect(d).toBeGreaterThanOrEqual(bounds[0]);
        expect(d).toBeLessThanOrEqual(bounds[1]);
      }
      expect(deliveryDuration(s, true)).toBeGreaterThanOrEqual(3 * MINUTE);
      expect(deliveryDuration(s, false)).toBeGreaterThanOrEqual(6 * MINUTE);
    }
  });
  it("przy intensywnym rynku nie wysyła wiadomości o towarze nieistniejącym", () => {
    const s = createGame(now, 42);
    advance(s, now + 15 * MINUTE);
    expect(s.threads).toHaveLength(0);
    expect(
      s.auctions.filter((a) => a.status === "active").length,
    ).toBeGreaterThanOrEqual(12);
  });
  it("nie uzależnia szacunku ceny od samej rzadkości i wycenia brak pudełka niżej", () => {
    const w = structuredClone(whisky("brora"));
    const before = auctionRange(w);
    w.market.rarity = 1;
    expect(auctionRange(w)).toEqual(before);
    expect(before.estimated).toBe(true);
    expect(estimatedHammerValue(w, 100, 0)).toBeLessThan(
      estimatedHammerValue(w, 100, 100),
    );
  });
  it("wykorzystuje potwierdzony przedział dopiero ze źródłami i datą", () => {
    const w = structuredClone(whisky("blue"));
    w.market.auctionMinCents = 10000;
    w.market.auctionMaxCents = 13000;
    expect(auctionRange(w).estimated).toBe(true);
    w.market.sources = ["https://example.com/completed-sale"];
    w.market.lastVerified = "2026-10-28";
    expect(auctionRange(w)).toEqual({
      min: 10000,
      max: 13000,
      estimated: false,
    });
  });
  it("wielodniowy replay doświadczenia jest taki sam po restarcie", () => {
    const a = createGame(now, 7);
    a.auctions[0].leader = "player";
    const b = structuredClone(a);
    const target = now + DAY;
    while (a.now < target) advance(a, target);
    for (let t = now + MINUTE; t <= target; t += MINUTE) advance(b, t);
    expect(a).toEqual(b);
    expect(progress(a).xp).toBe(25);
  });
});
