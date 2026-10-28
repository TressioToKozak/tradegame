import { describe, it, expect } from "vitest";
import { createGame, advance, inspect, list, MINUTE, cash } from "./engine";
import { daily, claimDaily, recordDaily, dailyKey } from "./daily";
import { progress } from "./progression";
import { parseSave } from "./storage";
const noon = Date.UTC(2026, 9, 28, 12);
describe("Cele dzienne wynikające z działań sklepu", () => {
  it("nalicza tylko rzeczywistą kontrolę i wystawienie, bez farmienia zmiany ceny", () => {
    const s = createGame(noon, 42);
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
    expect(claimDaily(s, "inspect")).toContain("jeszcze");
    inspect(s, "parcel");
    inspect(s, "parcel");
    list(s, "parcel", 16000);
    list(s, "parcel", 15000);
    expect(daily(s).completed.inspect).toEqual(["parcel"]);
    expect(daily(s).completed.list).toEqual(["parcel"]);
    expect(daily(s).completed.deliver).toHaveLength(0);
  });
  it("nagroda jest jednokrotnym PD, nie tworzy gotówki i przetrwa odświeżenie", () => {
    const s = createGame(noon, 42);
    recordDaily(s, "inspect", "i1");
    const before = cash(s),
      xp = progress(s).xp;
    expect(claimDaily(s, "inspect")).toContain("+15");
    expect(progress(s).xp).toBe(xp + 15);
    claimDaily(s, "inspect");
    expect(progress(s).xp).toBe(xp + 15);
    const restored = parseSave(JSON.stringify(s));
    claimDaily(restored, "inspect");
    expect(progress(restored).xp).toBe(xp + 15);
    expect(cash(restored)).toBe(before);
  });
  it("zmienia dzień według Amsterdamu i nie zalicza wczorajszych zadań jutro", () => {
    const s = createGame(Date.UTC(2026, 9, 28, 22, 58), 42);
    recordDaily(s, "list", "i");
    claimDaily(s, "list");
    expect(dailyKey(s.now)).toBe("2026-10-28");
    advance(s, s.now + 3 * MINUTE);
    expect(dailyKey(s.now)).toBe("2026-10-29");
    expect(daily(s).completed.list).toHaveLength(0);
    expect(daily(s).claimed).toHaveLength(0);
    expect(claimDaily(s, "list")).toContain("jeszcze");
  });
  it("powrót offline i przebieg minutowy zachowują identyczny dzień, cele i nagrody", () => {
    const a = createGame(noon, 7);
    recordDaily(a, "list", "b");
    claimDaily(a, "list");
    const b = structuredClone(a),
      target = noon + 24 * 60 * MINUTE;
    while (a.now < target) advance(a, target);
    for (let at = noon + MINUTE; at <= target; at += MINUTE) advance(b, at);
    expect(a).toEqual(b);
  });
});
