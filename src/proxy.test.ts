import { describe, it, expect } from "vitest";
import {
  createGame,
  advance,
  bid,
  activateProxy,
  disableProxy,
  setBidLimit,
  cash,
  held,
  totalCost,
  type State,
} from "./engine";
import { parseSave } from "./storage";
const now = Date.UTC(2026, 9, 28, 12);
function fixture(seconds = 60) {
  const s = createGame(now, 42),
    a = s.auctions[0];
  s.auctions = [a];
  s.events = [];
  Object.assign(a, {
    price: 17000,
    product: "blue",
    leader: null,
    end: now + seconds * 1000,
    fee: 0.12,
    shipping: 1500,
    limits: { p0: 30000, p1: 30000 },
    bids: [],
    proxyActive: false,
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
const tick = (s: State) => advance(s, s.now + 200);
describe("Rzeczywiste automatyczne licytowanie", () => {
  it("170 → 180, konkurent 190 → 200, konkurent 210 → stop; nie wydaje pełnego limitu na start", () => {
    const { s, a } = fixture();
    activateProxy(s, a.id, 20000);
    expect(a.price).toBe(17000);
    tick(s);
    expect(a.price).toBe(18000);
    expect(a.leader).toBe("player");
    bid(s, a.id, "p0", 19000);
    tick(s);
    expect(a.price).toBe(20000);
    expect(a.leader).toBe("player");
    bid(s, a.id, "p0", 21000);
    tick(s);
    expect(a.leader).toBe("p0");
    expect(a.proxyStatus).toBe("limit");
    expect(
      a.bids.filter((b) => b.actor === "player").map((b) => b.amount),
    ).toEqual([18000, 20000]);
    const notices = s.feed.filter((f) => f.text.includes("ponad limit")).length;
    advance(s, s.now + 10000);
    expect(s.feed.filter((f) => f.text.includes("ponad limit"))).toHaveLength(
      notices,
    );
  });
  it("nie podbija własnej prowadzącej oferty, nawet po zwiększeniu limitu", () => {
    const { s, a } = fixture();
    bid(s, a.id, "player", 18000);
    activateProxy(s, a.id, 20000);
    tick(s);
    activateProxy(s, a.id, 30000);
    tick(s);
    expect(a.price).toBe(18000);
    expect(a.bids).toHaveLength(1);
  });
  it("wyłączenie i zmiana limitu unieważniają wcześniejsze oczekujące decyzje", () => {
    const { s, a } = fixture();
    activateProxy(s, a.id, 20000);
    activateProxy(s, a.id, 19000);
    tick(s);
    expect(a.bids).toHaveLength(1);
    expect(a.playerLimit).toBe(19000);
    bid(s, a.id, "p0", 19000);
    disableProxy(s, a.id);
    tick(s);
    expect(a.leader).toBe("p0");
    expect(a.proxyActive).toBe(false);
    expect(a.playerLimit).toBeUndefined();
  });
  it("budżet uwzględnia prowizję i dostawę, nie samą cenę młotkową", () => {
    const { s, a } = fixture();
    s.ledger[0].amount = 19000;
    activateProxy(s, a.id, 20000);
    tick(s);
    expect(a.bids).toHaveLength(0);
    expect(a.proxyStatus).toBe("funds");
    expect(cash(s)).toBe(19000);
    expect(held(s)).toBe(0);
  });
  it("kilka automatów dzieli saldo i budzi się po zwolnieniu blokady", () => {
    const { s, a } = fixture();
    s.ledger[0].amount = 40000;
    const b = structuredClone(a);
    b.id = "other";
    s.auctions.push(b);
    activateProxy(s, a.id, 20000);
    activateProxy(s, b.id, 20000);
    tick(s);
    expect(a.leader).toBe("player");
    expect(b.proxyStatus).toBe("funds");
    expect(held(s)).toBeLessThanOrEqual(cash(s));
    bid(s, a.id, "p0", 20000);
    tick(s);
    expect(b.leader).toBe("player");
    expect(held(s)).toBe(totalCost(b));
    expect(held(s)).toBeLessThanOrEqual(cash(s));
  });
  it("gracz wygrywa równy maksymalny limit, gdy zarejestrował go wcześniej", () => {
    const { s, a } = fixture();
    a.limits.p0 = 20000;
    activateProxy(s, a.id, 20000);
    tick(s);
    bid(s, a.id, "p0", 20000);
    tick(s);
    expect(a.leader).toBe("player");
    expect(a.price).toBe(20000);
    expect(a.bids.at(-1)?.priority).toBe(true);
    tick(s);
    expect(a.bids).toHaveLength(3);
  });
  it("wcześniejszy maksymalny limit NPC ma takie samo pierwszeństwo", () => {
    const { s, a } = fixture();
    a.limits.p0 = 20000;
    bid(s, a.id, "p0", 19000);
    activateProxy(s, a.id, 20000);
    tick(s);
    expect(a.leader).toBe("player");
    tick(s);
    expect(a.leader).toBe("p0");
    expect(a.price).toBe(20000);
    expect(a.proxyStatus).toBe("limit");
    tick(s);
    expect(a.bids).toHaveLength(3);
  });
  it("trzy równe limity wybierają najwcześniejszy bez pętli wzajemnych ofert", () => {
    const { s, a } = fixture();
    a.limits.p0 = a.limits.p1 = 20000;
    bid(s, a.id, "p0", 18000);
    bid(s, a.id, "p1", 19000);
    activateProxy(s, a.id, 20000);
    tick(s);
    tick(s);
    advance(s, s.now + 2000);
    expect(a.leader).toBe("p0");
    expect(a.price).toBe(20000);
    expect(a.bids).toHaveLength(4);
    expect(s.events.filter((e) => e.type === "proxy")).toHaveLength(0);
  });
  it("odrzucona ręczna oferta tej samej ceny nie dostaje pierwszeństwa", () => {
    const { s, a } = fixture();
    activateProxy(s, a.id, 20000);
    tick(s);
    expect(bid(s, a.id, "p0", 18000)).toContain("Minimalne");
    expect(a.bids).toHaveLength(1);
  });
  it("wznowienie po JSON i nieobecność odtwarzają te same decyzje i jedno rozliczenie", () => {
    const { s, a } = fixture();
    activateProxy(s, a.id, 20000);
    const restored = parseSave(JSON.stringify(s));
    advance(s, a.end + 1000);
    advance(restored, a.end + 1000);
    expect(restored).toEqual(s);
    expect(s.items).toHaveLength(1);
    expect(s.ledger.filter((l) => l.type === "Zakup whisky")).toHaveLength(1);
    const before = cash(s);
    advance(s, s.now + 10000);
    expect(cash(s)).toBe(before);
    expect(s.items[0].auctionId).toBe(a.id);
  });
  it("dodatkowe powielone zdarzenie nie tworzy podwójnej oferty", () => {
    const { s, a } = fixture();
    activateProxy(s, a.id, 20000);
    const event = s.events.find((e) => e.type === "proxy")!;
    s.events.push({ ...event, id: ++s.serial });
    tick(s);
    expect(a.bids).toHaveLength(1);
  });
  it("stare playerLimit nie aktywuje automatu podczas migracji i odtwarzania", () => {
    const { s, a } = fixture();
    a.playerLimit = 20000;
    delete a.proxyActive;
    const restored = parseSave(JSON.stringify(s));
    expect(restored.auctions[0].proxyActive).toBe(false);
    advance(restored, a.end + 1000);
    expect(restored.auctions[0].bids).toHaveLength(0);
    expect(cash(restored)).toBe(500000);
    expect(restored.items).toHaveLength(0);
  });
  it("stare API limitu bezpieczeństwa również nie jest aktywacją", () => {
    const { s, a } = fixture();
    setBidLimit(s, a.id, 20000);
    tick(s);
    expect(a.proxyActive).toBe(false);
    expect(a.bids).toHaveLength(0);
  });
  it("każda ważna automatyczna zmiana lidera przedłuża końcówkę, ale nie rozlicza starych close", () => {
    const { s, a } = fixture(8);
    a.limits = { p0: 21000 };
    activateProxy(s, a.id, 20000);
    tick(s);
    expect(a.end).toBe(now + 23000);
    s.events = s.events.filter((e) => e.type !== "think");
    advance(s, now + 18000);
    bid(s, a.id, "p0", 19000);
    expect(a.end).toBe(now + 38000);
    tick(s);
    expect(a.price).toBe(20000);
    expect(a.end).toBe(now + 38000); // 19.8 seconds remain after NPC extension.
    advance(s, now + 24000);
    expect(a.status).toBe("active");
    advance(s, a.end);
    expect(a.status).toBe("closed");
    expect(s.ledger.filter((l) => l.type === "Zakup whisky")).toHaveLength(1);
    expect(activateProxy(s, a.id, 30000)).toContain("zakończona");
    expect(bid(s, a.id, "player", 30000)).toContain("spóźniona");
  });
  it("brak miejsca i nieprawidłowe limity nie obchodzą ograniczeń", () => {
    const { s, a } = fixture();
    expect(activateProxy(s, a.id, NaN)).toContain("prawidłową");
    expect(a.proxyActive).toBe(false);
    for (let i = 0; i < 24; i++)
      s.items.push({
        id: "i" + i,
        product: "red",
        cost: 1000,
        condition: 100,
        status: "stock",
        price: 0,
        views: 0,
        interested: [],
      });
    activateProxy(s, a.id, 20000);
    tick(s);
    expect(a.proxyStatus).toBe("capacity");
    expect(a.bids).toHaveLength(0);
  });
});
