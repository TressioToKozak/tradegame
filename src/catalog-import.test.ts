import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import records from "../data/johnnie-walker/source-catalog.json";
import mapping from "../data/johnnie-walker/id-map.json";
import provenance from "../data/johnnie-walker/image-provenance.json";
import legacyIds from "../data/johnnie-walker/legacy-ids.json";
import { catalog, whisky } from "./catalog";
import { photosFor, productMedia } from "./media";
import {
  createGame,
  makeAuction,
  bid,
  bidStep,
  totalCost,
  cash,
  advance,
  inspect,
  MINUTE,
} from "./engine";
import { conditionValueFactor } from "./market";
import { parseSave } from "./storage";
const now = Date.UTC(2026, 9, 28, 12);
describe("Pełny rzeczywisty import repozytorium whisky", () => {
  it("mapuje cały wybrany katalog jeden do jednego, bez obcych marek i bez utraty starych ID", () => {
    expect(records.filter((w) => w.brand === "Johnnie Walker")).toHaveLength(
      232,
    );
    expect(
      records.filter((w) => w.brand === "John Walker & Sons"),
    ).toHaveLength(21);
    expect(records.every((w) => mapping.brands.includes(w.brand))).toBe(true);
    expect(catalog.every((w) => mapping.brands.includes(w.brand ?? ""))).toBe(
      true,
    );
    const mapped = records.map(
      (w) => mapping.entries[w.id as keyof typeof mapping.entries].gameId,
    );
    expect(new Set(mapped).size).toBe(records.length);
    for (const source of records) {
      const game = whisky(
        mapping.entries[source.id as keyof typeof mapping.entries].gameId,
      );
      expect(game.importSource?.id).toBe(source.id);
      expect(game.brand).toBe(source.brand);
      expect(game.volumeMl).toBe(source.volume);
      expect(game.abv).toBe(source.abv);
      expect(game.ageStatement).toBe(source.age);
    }
    for (const id of legacyIds) expect(whisky(id)).toBeDefined();
    expect(whisky("double").volumeMl).toBe(1000);
    expect(whisky("jw-005").volumeMl).toBe(700);
    expect(whisky("rye").id).not.toBe(whisky("high-rye").id);
    expect(whisky("jw-62256392d42a").id).not.toBe(whisky("swing").id);
  });
  it("każdy źródłowy obraz ma przypisanie z katalogu, lokalny plik i zgodny hash", () => {
    expect(provenance).toHaveLength(records.length);
    expect(new Set(provenance.map((p) => p.sourceSha256)).size).toBe(
      records.length,
    );
    for (const r of records) {
      const p = provenance.find((p) => p.sourceId === r.id)!;
      expect(p.sourcePath).toBe(r.image);
      const file = new URL("../public/" + p.path, import.meta.url);
      expect(existsSync(file)).toBe(true);
      expect(
        createHash("sha256").update(readFileSync(file)).digest("hex"),
      ).toBe(p.outputSha256);
      expect(photosFor(p.gameId)[0].sourceSha256).toBe(p.sourceSha256);
    }
    expect(
      provenance.every((p) => records.some((r) => r.id === p.sourceId)),
    ).toBe(true);
  });
  it("każdy importowany produkt obsługuje licytację, rozliczenie i dostawę bez specjalnego kodu edycji", () => {
    const s = createGame(now, 42);
    s.ledger.push({
      id: "test-capital",
      at: now,
      amount: 1000000000,
      type: "Kapitał testowy",
      ref: "test",
    });
    for (const source of records) {
      s.events = [];
      s.auctions = [];
      const id =
        mapping.entries[source.id as keyof typeof mapping.entries].gameId;
      makeAuction(
        s,
        catalog.findIndex((w) => w.id === id),
        s.now + 4 * MINUTE,
      );
      const a = s.auctions[0];
      s.events = s.events.filter((e) => e.type === "close");
      const amount = a.price + bidStep(a.price),
        before = cash(s);
      expect(bid(s, a.id, "player", amount)).toContain("zaakceptowana");
      const cost = totalCost(a);
      advance(s, a.end);
      expect(cash(s)).toBe(before - cost);
      const item = s.items.at(-1)!;
      expect(item.product).toBe(id);
      expect(item.cost).toBe(cost);
      expect(item.status).toBe("incoming");
      advance(s, item.due!);
      expect(item.status).toBe("inspect");
      inspect(s, item.id);
      expect(item.status).toBe("stock");
      const balance = cash(s);
      advance(s, s.now);
      expect(cash(s)).toBe(balance);
      // Completed items leave the test warehouse; production capacity still applies normally.
      item.status = "sold";
    }
  });
  it("nie zmienia pieniędzy, ceny aukcji i kosztów zapasu ze starszego zapisu", () => {
    const s = createGame(now, 42);
    delete s.progression;
    s.items = [
      {
        id: "legacy-bottle",
        product: "port",
        cost: 56789,
        condition: 95,
        status: "listed",
        price: 71000,
        views: 2,
        interested: [],
      },
    ];
    s.auctions[0].price = 17321;
    s.auctions[0].fee = 0.12;
    s.auctions[0].shipping = 1789;
    const before = structuredClone({
      ledger: s.ledger,
      items: s.items,
      auctions: s.auctions,
      events: s.events,
    });
    const restored = parseSave(JSON.stringify(s));
    advance(restored, now);
    expect({
      ledger: restored.ledger,
      items: restored.items,
      auctions: restored.auctions,
      events: restored.events,
    }).toEqual(before);
  });
  it("premia pudełka jest osobna od stanu butelki i nie jest naliczana podwójnie", () => {
    const w = whisky("blue");
    expect(
      conditionValueFactor(w, 100, 100) / conditionValueFactor(w, 100, 0),
    ).toBeCloseTo(1.12);
    expect(conditionValueFactor(w, 80, 100)).toBeCloseTo(0.8);
  });
  it("nie podszywa historycznych wyników ani niezgodnych pojemności pod holenderski detal", () => {
    const high = whisky("high-rye").market;
    expect(high.retailCents).toBeNull();
    expect(high.sourceQuote?.soldAt).toBe("2024-09");
    expect(high.pricingNeedsReview).toBe(true);
    const unknown = whisky("jw-ed-827e6170c814");
    expect(unknown.volumeMl).toBeNull();
    expect(unknown.abv).toBeNull();
    expect(unknown.market.lastVerified).toBeNull();
    expect(unknown.market.auctionMinCents).toBeNull();
    expect(whisky("brora").market.sampleCount).toBe(4);
    expect(whisky("brora").market.auctionMinCents).toBe(47352);
    expect(whisky("brora").market.auctionMaxCents).toBe(56822);
  });
});
