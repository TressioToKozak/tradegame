import { describe, it, expect } from "vitest";
import {
  advance,
  createGame,
  bid,
  cash,
  held,
  totalCost,
  respond,
  ship,
  pack,
  refund,
  MINUTE,
  DAY,
  list,
  inspect,
  interpret,
  submitBid,
} from "./engine";
import { parseSave } from "./storage";
const noon = Date.UTC(2026, 9, 27, 11);
function storefront() {
  const s = createGame(noon, 42);
  s.items.push({
    id: "test-item",
    product: "blue",
    cost: 14000,
    condition: 100,
    status: "stock",
    price: 0,
    views: 0,
    interested: [],
  });
  list(s, "test-item", 19000);
  return s;
}
function inquiry() {
  const s = storefront();
  advance(s, noon + 60 * MINUTE);
  return s;
}
describe("Trwały, deterministyczny świat", () => {
  it("odtwarza te same decyzje jedną porcją i po restarcie", () => {
    const a = createGame(noon, 99),
      b = createGame(noon, 99);
    advance(a, noon + 2 * DAY);
    for (let t = noon + MINUTE; t <= noon + 2 * DAY; t += MINUTE) advance(b, t);
    expect(a).toEqual(b);
    expect(a.people.some((p) => p.memory.some((m) => m.kind === "bid"))).toBe(
      true,
    );
  });
  it("nie przetwarza ponownie rozliczeń i pamięci", () => {
    const s = createGame(noon, 99);
    advance(s, noon + 30 * MINUTE);
    const copy = structuredClone(s);
    advance(s, s.now);
    expect(s).toEqual(copy);
  });
  it("cofnięcie zegara nie odwraca rozgrywki", () => {
    const s = createGame(noon);
    advance(s, noon - 1000);
    expect(s.now).toBe(noon);
    expect(s.clockWarning).toBe(true);
  });
  it("wznowienie po JSON zachowuje generator, budżety i kolejkę", () => {
    const s = createGame(noon, 12);
    advance(s, noon + 3 * MINUTE);
    const b = parseSave(JSON.stringify(s));
    advance(s, noon + DAY);
    advance(b, noon + DAY);
    expect(s).toEqual(b);
  });
});
describe("Aukcje i pieniądze", () => {
  it("blokuje pełny koszt ofert bez pobierania pieniędzy przed wygraną", () => {
    const s = createGame(noon);
    const a = s.auctions[0];
    expect(bid(s, a.id, "player", a.price + 500)).toContain("zaakceptowana");
    expect(held(s)).toBe(totalCost(a));
    expect(cash(s)).toBe(500000);
    expect(bid(s, s.auctions[1].id, "player", 500000)).toContain("budżetu");
  });
  it("rozlicza zwycięstwo raz, tworzy dostawę i pozwala ją skontrolować", () => {
    const s = createGame(noon);
    s.people.filter((p) => p.role === "bidder").forEach((p) => (p.budget = 0));
    const a = s.auctions[0];
    bid(s, a.id, "player", a.price + 500);
    const cost = totalCost(a);
    advance(s, a.end);
    expect(cash(s)).toBe(500000 - cost);
    expect(s.items[0].status).toBe("incoming");
    advance(s, a.end + DAY);
    expect(s.items[0].status).toBe("inspect");
    inspect(s, s.items[0].id);
    expect(s.items[0].status).toBe("stock");
    advance(s, s.now);
    expect(s.ledger.filter((l) => l.ref === a.id)).toHaveLength(3);
  });
  it("odrzuca ofertę za niską i zarejestrowaną po terminie", () => {
    const s = createGame(noon);
    const a = s.auctions[0];
    expect(bid(s, a.id, "player", a.price)).toContain("przebicie");
    s.now = a.end - 50;
    submitBid(s, a.id, a.price + 500);
    advance(s, a.end + 1000);
    expect(a.bids.some((b) => b.actor === "player")).toBe(false);
    expect(s.feed.some((f) => f.text.includes("spóźniona"))).toBe(true);
  });
  it("rywal nie przekracza limitu ani wspólnego budżetu", () => {
    const s = createGame(noon, 44);
    advance(s, noon + 20 * MINUTE);
    for (const p of s.people) {
      expect(p.budget).toBeGreaterThanOrEqual(0);
      expect(p.reserved).toBeGreaterThanOrEqual(0);
      for (const a of s.auctions)
        for (const b of a.bids.filter((b) => b.actor === p.id))
          expect(b.amount).toBeLessThanOrEqual(a.limits[p.id]);
    }
  });
});
describe("Klienci, pamięć i realizacja", () => {
  it("tworzy zapytania na podstawie istniejącego klienta i oferty", () => {
    const s = inquiry();
    expect(s.threads.length).toBeGreaterThan(0);
    for (const t of s.threads) {
      const c = s.people.find((p) => p.id === t.customer)!;
      expect(t.offer).toBeLessThanOrEqual(c.budget);
      expect(
        c.memory.some((m) => m.kind === "inquiry" && m.ref === "test-item"),
      ).toBe(true);
    }
  });
  it("odrzuca za drogą kontrpropozycję i nie sprzedaje egzemplarza dwukrotnie", () => {
    const s = inquiry(),
      t = s.threads[0];
    expect(respond(s, t.id, "counter", "", 1000000)).toContain("odrzucił");
    const clone = structuredClone(t);
    clone.id = "other";
    s.threads.push(clone);
    expect(respond(s, t.id, "accept")).toContain("potwierdzona");
    respond(s, clone.id, "accept");
    expect(s.orders).toHaveLength(1);
    expect(s.items[0].status).toBe("reserved");
    expect(s.ledger.filter((l) => l.type === "Wpłata klienta")).toHaveLength(1);
  });
  it("księguje osobno wpłatę, opłatę i wysyłkę; nie nadaje ponownie", () => {
    const s = inquiry();
    respond(s, s.threads[0].id, "accept");
    const o = s.orders[0];
    const before = cash(s);
    pack(s, o.id);
    ship(s, o.id);
    ship(s, o.id);
    expect(cash(s)).toBe(before - 950);
    advance(s, s.now + 2 * DAY);
    expect(o.status).toBe("delivered");
    expect(s.items[0].status).toBe("sold");
    expect(
      s.people
        .find((p) => p.id === o.customer)!
        .memory.some((m) => m.kind === "delivered"),
    ).toBe(true);
    expect(refund(s, o.id, o.total)).toContain("zaksięgowany");
    const after = cash(s);
    refund(s, o.id, o.total);
    expect(cash(s)).toBe(after);
    expect(o.status).toBe("returned");
  });
  it("brak zabezpieczenia prowadzi do uzasadnionej reklamacji", () => {
    const s = inquiry();
    respond(s, s.threads[0].id, "accept");
    ship(s, s.orders[0].id);
    advance(s, s.now + 2 * DAY);
    expect(s.orders[0].status).toBe("complaint");
  });
  it("nie rozumie sprzecznych intencji ani kilku cen", () => {
    expect(interpret("Proponuję 220 €")).toEqual({
      intent: "counter",
      price: 22000,
    });
    expect(interpret("Akceptuję, ale proszę poczekać").intent).toBe("unclear");
    expect(interpret("220 lub 240").intent).toBe("unclear");
    expect(interpret("nie zgadzam się").intent).toBe("reject");
  });
});

import { sendResponse, markRead, unreadCount } from "./engine";
describe("Zapisane odpowiedzi klientów i zgodność zapisu", () => {
  it("nie rozlicza sprzedaży przed decyzją klienta i zapisuje przyszłą odpowiedź", () => {
    const s = inquiry(),
      t = s.threads[0],
      before = cash(s);
    expect(sendResponse(s, t.id, "accept")).toContain("wysłana");
    expect(t.pendingReply).toBeDefined();
    expect(s.orders).toHaveLength(0);
    expect(cash(s)).toBe(before);
    expect(sendResponse(s, t.id, "accept")).toContain("Poczekaj");
    const restored = parseSave(JSON.stringify(s));
    advance(s, t.pendingReply!.at);
    advance(restored, restored.threads[0].pendingReply!.at);
    expect(s).toEqual(restored);
    expect(s.orders).toHaveLength(1);
    expect(t.messages.filter((m) => m.from === "Ty")).toHaveLength(1);
    expect(t.messages.at(-1)?.text).toContain("Zgadzam");
  });
  it("wcześniejszy format wersji 1 nie wymaga nowych pól", () => {
    const s = inquiry();
    s.threads.forEach((t) => {
      delete t.readAt;
      delete t.pendingReply;
    });
    expect(() => parseSave(JSON.stringify(s))).not.toThrow();
    expect(unreadCount(s.threads[0])).toBeGreaterThan(0);
    markRead(s, s.threads[0].id);
    expect(unreadCount(s.threads[0])).toBe(0);
  });
  it("kolejna osoba nie kupuje butelki sprzedanej podczas oczekiwania na odpowiedź", () => {
    const s = inquiry();
    expect(s.threads.length).toBeGreaterThan(1);
    sendResponse(s, s.threads[0].id, "accept");
    sendResponse(s, s.threads[1].id, "accept");
    advance(s, s.now + 5 * MINUTE);
    expect(s.orders).toHaveLength(1);
    expect(s.ledger.filter((l) => l.type === "Wpłata klienta")).toHaveLength(1);
  });
  it("przeterminowane zapytanie nie zostaje sprzedane przez spóźnioną odpowiedź", () => {
    const s = inquiry(),
      t = s.threads[0];
    advance(s, t.expires - 1);
    sendResponse(s, t.id, "accept");
    advance(s, s.now + 5 * MINUTE);
    expect(t.status).toBe("expired");
    expect(s.orders).toHaveLength(0);
  });
  it("nieprawidłowa intencja i kwota nie tworzą zdarzenia odpowiedzi", () => {
    const s = inquiry(),
      t = s.threads[0],
      before = s.events.length;
    sendResponse(s, t.id, "unclear");
    sendResponse(s, t.id, "counter", "", NaN);
    expect(s.events.length).toBe(before);
    expect(t.pendingReply).toBeUndefined();
  });
});
