import Dexie, { type Table } from "dexie";
import { migrateGame, type State } from "./engine";
class Saves extends Dexie {
  games!: Table<{ id: string; state: State }>;
  constructor() {
    super("jw-collection-store");
    this.version(1).stores({ games: "id" });
  }
}
const db = new Saves();
export const load = async () => (await db.games.get("main"))?.state;
export const backupLegacy = (state: State) =>
  db.games.put({ id: "pre-v2", state: structuredClone(state) });
export const save = (state: State) =>
  db.games.put({ id: "main", state: structuredClone(state) });
// Import jest lokalny; odrzucamy obce wersje i niepoprawne struktury przed wykonaniem silnika.
export function parseSave(text: string): State {
  const s = JSON.parse(text);
  if (!s || ![1, 2].includes(s.version))
    throw Error("Nieobsługiwana wersja zapisu. Obsługiwane: 1 i 2.");
  for (const k of ["seed", "serial", "now", "started", "reputation"])
    if (!Number.isFinite(s[k])) throw Error("Nieprawidłowe dane liczbowe.");
  for (const k of [
    "people",
    "auctions",
    "items",
    "threads",
    "orders",
    "ledger",
    "events",
    "feed",
  ])
    if (!Array.isArray(s[k])) throw Error("Niekompletny zapis.");
  if (
    s.version === 2 &&
    !["Spokojne", "Dynamiczne", "Intensywne"].includes(s.pace)
  )
    throw Error("Nieprawidłowe tempo gry.");
  // Zgodność struktury i integralność referencji sprawdza walidator.
  validate(s);
  return migrateGame(s);
}
function validate(s: State) {
  const finite = (n: unknown) => typeof n === "number" && Number.isFinite(n);
  const money = (n: unknown) =>
    finite(n) && Number.isSafeInteger(n) && Number(n) >= 0;
  const unique = (xs: { id: string | number }[]) =>
    new Set(xs.map((x) => x.id)).size === xs.length;
  const fail = () => {
    throw Error("Uszkodzony zapis: struktura lub referencje są nieprawidłowe.");
  };
  if (
    !["Łatwa", "Normalna", "Realistyczna", "Ekspert"].includes(s.difficulty) ||
    !Number.isSafeInteger(s.seed) ||
    !Number.isSafeInteger(s.serial)
  )
    fail();
  for (const xs of [
    s.people,
    s.auctions,
    s.items,
    s.threads,
    s.orders,
    s.events,
    s.ledger,
  ])
    if (!unique(xs)) fail();
  const person = (id: string) => s.people.some((p) => p.id === id),
    item = (id: string) => s.items.some((i) => i.id === id);
  for (const p of s.people)
    if (
      typeof p.id !== "string" ||
      typeof p.name !== "string" ||
      !money(p.budget) ||
      !money(p.reserved) ||
      p.reserved > p.budget ||
      !Array.isArray(p.memory) ||
      p.memory.some((m) => !finite(m.at) || typeof m.kind !== "string") ||
      !Array.isArray(p.favorites) ||
      !Array.isArray(p.owned) ||
      ![
        p.patience,
        p.trust,
        p.sensitivity,
        p.negotiation,
        p.nextVisit,
        p.preferredCondition,
      ].every(finite) ||
      !["early", "measured", "snipe"].includes(p.strategy) ||
      !["bidder", "customer"].includes(p.role)
    )
      fail();
  for (const a of s.auctions)
    if (
      typeof a.id !== "string" ||
      !knownProduct(a.product) ||
      !money(a.price) ||
      !finite(a.end) ||
      !finite(a.fee) ||
      a.fee < 0 ||
      !money(a.shipping) ||
      !Array.isArray(a.bids) ||
      !a.limits ||
      !["active", "closed"].includes(a.status) ||
      (a.leader !== null && a.leader !== "player" && !person(a.leader))
    )
      fail();
  for (const i of s.items)
    if (
      !knownProduct(i.product) ||
      !money(i.cost) ||
      !money(i.price) ||
      !Array.isArray(i.interested) ||
      !finite(i.condition) ||
      !["incoming", "inspect", "stock", "listed", "reserved", "sold"].includes(
        i.status,
      )
    )
      fail();
  for (const t of s.threads)
    if (
      !person(t.customer) ||
      !item(t.item) ||
      !money(t.offer) ||
      !finite(t.expires) ||
      !Array.isArray(t.messages) ||
      t.messages.some((m) => typeof m.text !== "string" || !finite(m.at)) ||
      !["open", "accepted", "declined", "expired"].includes(t.status)
    )
      fail();
  for (const t of s.threads)
    if (
      t.pendingReply &&
      (!["accept", "reject", "counter", "wait", "photos", "shipping"].includes(
        t.pendingReply.intent,
      ) ||
        !finite(t.pendingReply.at))
    )
      fail();
  for (const o of s.orders)
    if (
      !person(o.customer) ||
      !item(o.item) ||
      !money(o.total) ||
      !money(o.refund) ||
      o.refund > o.total ||
      !finite(o.due) ||
      !finite(o.returnUntil) ||
      !finite(o.quality) ||
      !["packing", "shipping", "delivered", "complaint", "returned"].includes(
        o.status,
      )
    )
      fail();
  for (const e of s.events)
    if (
      !Number.isSafeInteger(e.id) ||
      !finite(e.at) ||
      typeof e.ref !== "string" ||
      typeof e.done !== "boolean" ||
      ![
        "think",
        "bid",
        "close",
        "arrival",
        "visit",
        "expire",
        "delivery",
        "market",
        "reply",
      ].includes(e.type)
    )
      fail();
  for (const l of s.ledger)
    if (
      !Number.isSafeInteger(l.amount) ||
      !finite(l.at) ||
      typeof l.type !== "string"
    )
      fail();
  for (const f of s.feed)
    if (!finite(f.at) || typeof f.text !== "string") fail();
}
import { catalog } from "./catalog";
const knownProduct = (id: string) => catalog.some((w) => w.id === id);
