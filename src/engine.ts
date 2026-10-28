import {
  progress,
  earn,
  checkAchievements,
  capacity,
  unlockedContacts,
  type Progression,
} from "./progression";
import { auctionRange, estimatedHammerValue } from "./market";
import initialProducts from "./initial-products.json" with { type: "json" };
import { catalog, whisky, type MarketData } from "./catalog";
import { EventQueue } from "./scheduler";
import { paceFactor, type Pace } from "./pace";
export type { Pace } from "./pace";
export const MINUTE = 60_000,
  DAY = 86_400_000;
type Memory = { at: number; kind: string; ref: string; detail: string };
export interface Person {
  id: string;
  name: string;
  city: string;
  role: "bidder" | "customer";
  budget: number;
  reserved: number;
  favorites: string[];
  patience: number;
  sensitivity: number;
  negotiation: number;
  trust: number;
  strategy: "early" | "measured" | "snipe";
  memory: Memory[];
  owned: string[];
  nextVisit: number;
  preferredCondition: number;
  country?: string;
  favoriteEditions?: string[];
  risk?: number;
  responseStyle?: "fast" | "typical" | "slow" | "silent";
}
export interface Auction {
  id: string;
  product: string;
  end: number;
  createdAt?: number;
  watched?: boolean;
  playerLimit?: number;
  bottleCondition?: number;
  boxCondition?: number;
  price: number;
  leader: string | null;
  status: "active" | "closed";
  fee: number;
  shipping: number;
  condition: number;
  country: string;
  supplierContact?: string;
  limits: Record<string, number>;
  bids: { at: number; actor: string; amount: number }[];
  watchers?: string[];
  extensions?: { at: number; actor: string; oldEnd: number; newEnd: number }[];
}
export interface Item {
  id: string;
  product: string;
  cost: number;
  condition: number;
  status: "incoming" | "inspect" | "stock" | "listed" | "reserved" | "sold";
  price: number;
  views: number;
  interested: string[];
  bottleCondition?: number;
  boxCondition?: number;
  expectedCondition?: number;
  supplierClaim?: "open" | "resolved";
  due?: number;
}
export interface Thread {
  id: string;
  customer: string;
  item: string;
  offer: number;
  expires: number;
  status: "open" | "accepted" | "declined" | "expired";
  messages: { at: number; from: string; text: string }[];
  readAt?: number;
  pendingReply?: { intent: Intent; price?: number; at: number };
}
export interface Order {
  id: string;
  item: string;
  customer: string;
  total: number;
  status: "packing" | "shipping" | "delivered" | "complaint" | "returned";
  packed: boolean;
  due: number;
  returnUntil: number;
  quality: number;
  refund: number;
}
export interface Ledger {
  id: string;
  at: number;
  amount: number;
  type: string;
  ref: string;
}
export interface Event {
  id: number;
  at: number;
  type:
    | "think"
    | "bid"
    | "close"
    | "arrival"
    | "visit"
    | "expire"
    | "delivery"
    | "market"
    | "reply";
  ref: string;
  actor?: string;
  amount?: number;
  done: boolean;
}
export interface State {
  version: 2;
  pace: Pace;
  tutorialDone?: boolean;
  progression?: Progression;
  seed: number;
  serial: number;
  now: number;
  started: number;
  difficulty: string;
  reputation: number;
  people: Person[];
  auctions: Auction[];
  items: Item[];
  threads: Thread[];
  orders: Order[];
  ledger: Ledger[];
  events: Event[];
  feed: { at: number; text: string }[];
  clockWarning: boolean;
}
const names = [
  "Collector1978",
  "MaltTraderNL",
  "CaskStrengthBE",
  "VintageHunter",
  "BlueLabelHunter",
  "Emma de Vries",
  "Lucas Janssen",
  "Sophie van Dijk",
  "Thomas Peeters",
  "Julia Visser",
];
export function random(s: State) {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
const id = (s: State, p: string) => p + ++s.serial;
const queues = new WeakMap<State, EventQueue>();
const schedule = (
  s: State,
  at: number,
  type: Event["type"],
  ref: string,
  actor?: string,
  amount?: number,
) => {
  const e: Event = {
    id: ++s.serial,
    at,
    type,
    ref,
    actor,
    amount,
    done: false,
  };
  s.events.push(e);
  queues.get(s)?.push(e);
};
const log = (s: State, text: string) => {
  s.feed.unshift({ at: s.now, text });
  s.feed = s.feed.slice(0, 200);
};
const remember = (
  s: State,
  p: Person,
  kind: string,
  ref: string,
  detail: string,
) => {
  p.memory.push({ at: s.now, kind, ref, detail });
  if (p.memory.length > 120) p.memory.splice(0, p.memory.length - 120);
};
const post = (
  s: State,
  key: string,
  amount: number,
  type: string,
  ref: string,
) => {
  if (!s.ledger.some((l) => l.id === key))
    s.ledger.push({ id: key, at: s.now, amount, type, ref });
};
export const cash = (s: State) => s.ledger.reduce((a, l) => a + l.amount, 0);
export const totalCost = (a: Auction, price = a.price) =>
  price + Math.round(price * a.fee) + a.shipping;
export const held = (s: State, except = "") =>
  s.auctions
    .filter(
      (a) => a.id !== except && a.status === "active" && a.leader === "player",
    )
    .reduce((n, a) => n + totalCost(a), 0);
const available = (p: Person) => p.budget - p.reserved;
export function createGame(
  now = Date.now(),
  seed = 123456,
  difficulty = "Realistyczna",
  pace: Pace = "Dynamiczne",
): State {
  const s: State = {
    version: 2,
    pace,
    seed,
    serial: 0,
    now,
    started: now,
    difficulty,
    reputation: 55,
    people: [],
    auctions: [],
    items: [],
    threads: [],
    orders: [],
    ledger: [],
    events: [],
    feed: [],
    clockWarning: false,
  };
  names.forEach((name, i) =>
    s.people.push({
      id: "p" + i,
      name,
      city: ["Amsterdam", "Rotterdam", "Antwerpia", "Utrecht", "Haga"][i % 5],
      role: i < 5 ? "bidder" : "customer",
      budget: i < 5 ? 65000 + i * 23000 : 10000 + i * 6500,
      reserved: 0,
      favorites:
        i === 1
          ? ["standard"]
          : i === 3
            ? ["vintage"]
            : i === 2
              ? ["travel", "blue"]
              : i === 4
                ? ["blue"]
                : ["standard", "blue", "vintage"],
      patience: 0.25 + random(s) * 0.7,
      sensitivity: i === 1 ? 0.95 : 0.2 + random(s) * 0.65,
      negotiation: random(s),
      trust: 0.5,
      strategy: i % 3 === 0 ? "early" : i % 3 === 1 ? "measured" : "snipe",
      memory: [],
      owned: [],
      nextVisit: now + (i - 4) * 60_000,
      preferredCondition: i % 3 === 0 ? 100 : 80,
    }),
  );
  post(s, "opening", 500000, "Kapitał początkowy", "company");
  addBidders(s);
  for (const [availability, count] of Object.entries(initialProducts)) {
    for (let i = 0; i < count; i++) {
      const index = chooseMarketProduct(
        s,
        availability as MarketData["availability"],
      );
      makeAuction(s, index, now + auctionDuration(s, index));
    }
  }

  s.people
    .filter((p) => p.role === "customer")
    .forEach((p) => schedule(s, p.nextVisit, "visit", p.id));
  schedule(s, now + marketInterval(s), "market", "world");
  log(s, "Sklep otwarty. Kapitał początkowy: 5 000 €.");
  return s;
}
export function makeAuction(s: State, index: number, end: number) {
  const w = catalog[index];
  const range = auctionRange(w);
  const contacts = unlockedContacts(s).filter(
    (c) =>
      c.id === "noor" ||
      (c.id === "luc" && ["travel", "vintage"].includes(w.category)) ||
      (c.id === "marta" && ["blue", "vintage"].includes(w.category)),
  );
  const supplier =
    contacts.length && random(s) < 0.25
      ? contacts[Math.floor(random(s) * contacts.length)]
      : undefined;
  const country =
    supplier?.country ??
    ["Holandia", "Belgia", "Niemcy"][Math.floor(random(s) * 3)];
  const bottleCondition = random(s) < 0.9 ? 100 : 95;
  const boxCondition = [75, 85, 95, 100, 100, 100, 100][
    Math.floor(random(s) * 7)
  ];
  const condition = Math.min(bottleCondition, boxCondition);
  const fee = [0.1, 0.12, 0.15][Math.floor(random(s) * 3)];
  const shipping =
    country === "Holandia"
      ? 500 + Math.floor(random(s) * 6) * 100
      : 1200 + Math.floor(random(s) * 10) * 100;
  const a: Auction = {
    id: id(s, "A"),
    product: w.id,
    end: Math.max(end, s.now + 45000),
    createdAt: s.now,
    bottleCondition,
    boxCondition,
    price: Math.max(
      500,
      Math.round(
        ((range.min + random(s) * (range.max - range.min) * 0.35) *
          (0.82 + random(s) * 0.1) *
          (bottleCondition / 100) *
          (0.8 + boxCondition / 500)) /
          100,
      ) * 100,
    ),
    leader: null,
    status: "active",
    fee,
    shipping,
    condition,
    country,
    ...(supplier ? { supplierContact: supplier.id } : {}),
    limits: {},
    bids: [],
  };
  s.auctions.push(a);
  const candidates = s.people.filter(
    (p) => p.role === "bidder" && p.budget - p.reserved > totalCost(a),
  );
  const participants = candidates.filter(
    (p) =>
      p.favorites.includes(w.category) &&
      random(s) < 0.08 + (w.market.demand / 100) * 0.4,
  );
  for (const p of participants.slice(0, 8)) {
    const interest = p.favorites.includes(w.category) ? 1 : 0.55;
    const duplicate = p.owned.includes(w.id) ? 0.65 : 1;
    const losses = p.memory.filter(
      (m) => m.kind === "lost" && m.detail === w.id,
    ).length;
    const difficulty = ["Łatwa", "Normalna", "Realistyczna", "Ekspert"].indexOf(
      s.difficulty,
    );
    const preference = p.favoriteEditions?.includes(w.id) ? 1.12 : 1;
    const modeled =
      (1.24 - p.sensitivity * 0.4 + Math.min(losses, 3) * 0.03) *
      (0.9 + difficulty * 0.05) *
      preference;
    const ceiling =
      w.market.availability === "common"
        ? 1.06
        : p.sensitivity >= 0.8
          ? 0.9
          : 1.4;
    const allIn =
      (estimatedHammerValue(
        w,
        a.bottleCondition ?? a.condition,
        a.boxCondition ?? a.condition,
      ) *
        (1 + a.fee) *
        interest *
        duplicate *
        Math.min(ceiling, modeled) *
        a.condition) /
      100;
    const tradeCosts =
      p.sensitivity >= 0.8 ? 950 + Math.round(w.value * 0.025) : 0;
    a.limits[p.id] = Math.max(
      0,
      Math.floor((allIn - tradeCosts - a.shipping) / (1 + a.fee)),
    );
    const at =
      p.strategy === "snipe"
        ? a.end - 2000 - Math.floor(random(s) * 14000)
        : s.now +
          Math.floor((a.end - s.now) * (p.strategy === "early" ? 0.08 : 0.45));
    schedule(s, at, "think", a.id, p.id);
  }
  schedule(s, a.end, "close", a.id);
}
export function bid(
  s: State,
  auctionId: string,
  actor: string,
  amount: number,
) {
  const a = s.auctions.find((a) => a.id === auctionId);
  if (!a || a.status !== "active" || s.now >= a.end) return "Oferta spóźniona.";
  if (!Number.isSafeInteger(amount) || amount < a.price + bidStep(a.price))
    return `Minimalne przebicie wynosi ${bidStep(a.price) / 100} €.`;
  if (
    actor === "player" &&
    a.playerLimit !== undefined &&
    amount > a.playerLimit
  )
    return "Oferta przekracza Twój zapisany limit licytacji.";
  if (a.leader === actor) return "Już prowadzisz w tej aukcji.";
  if (
    actor === "player" &&
    s.items.filter((i) => i.status !== "sold").length +
      s.auctions.filter(
        (x) => x.status === "active" && x.leader === "player" && x.id !== a.id,
      ).length >=
      capacity(s)
  )
    return "Magazyn pełny. Rozbuduj go przed zakupem.";
  const p = s.people.find((p) => p.id === actor);
  const cost = totalCost(a, amount);
  if (
    actor === "player"
      ? cost > cash(s) - held(s, a.id)
      : !p || cost > available(p) || amount > a.limits[actor]
  )
    return "Brak dostępnego budżetu lub przekroczony limit.";
  const wasPlayer = a.leader === "player";
  const old = s.people.find((p) => p.id === a.leader);
  if (old) old.reserved -= totalCost(a);
  if (p) p.reserved += cost;
  a.price = amount;
  a.leader = actor;
  a.bids.push({ at: s.now, actor, amount });
  if (a.end - s.now <= 10000) extendAuction(s, a, actor);
  if (p) remember(s, p, "bid", a.id, String(amount));
  if (wasPlayer && actor !== "player")
    log(s, `Zostałeś przebity w aukcji ${a.id} przez ${p?.name}.`);
  log(
    s,
    `${p?.name ?? "Ty"}: oferta ${(amount / 100).toFixed(2)} € — ${whisky(a.product).name}.`,
  );
  return "Oferta zaakceptowana.";
}
export function submitBid(s: State, auctionId: string, amount: number) {
  const auction = s.auctions.find((a) => a.id === auctionId);
  const occupied =
    s.items.filter((i) => i.status !== "sold").length +
    s.auctions.filter(
      (a) =>
        a.status === "active" && a.leader === "player" && a.id !== auctionId,
    ).length;
  if (auction?.leader !== "player" && occupied >= capacity(s))
    return "Magazyn pełny. Sprzedaj towar lub zwiększ pojemność.";
  schedule(
    s,
    s.now + 100 + Math.floor(random(s) * 801),
    "bid",
    auctionId,
    "player",
    amount,
  );
  return "Oferta wysłana — oczekiwanie na rejestrację.";
}
function close(s: State, a: Auction) {
  if (a.status === "closed") return;
  a.status = "closed";
  const cost = totalCost(a);
  const winner = s.people.find((p) => p.id === a.leader);
  if (winner) {
    winner.reserved -= cost;
    winner.budget -= cost;
    if (!winner.owned.includes(a.product)) winner.owned.push(a.product);
    remember(s, winner, "won", a.id, a.product);
  }
  for (const p of s.people.filter(
    (p) =>
      p.role === "bidder" &&
      a.bids.some((b) => b.actor === p.id) &&
      p.id !== a.leader,
  ))
    remember(s, p, "lost", a.id, a.product);
  if (a.leader === "player") {
    post(s, a.id + "purchase", -a.price, "Zakup whisky", a.id);
    post(
      s,
      a.id + "fee",
      -Math.round(a.price * a.fee),
      "Prowizja aukcyjna",
      a.id,
    );
    post(s, a.id + "shipping", -a.shipping, "Transport do magazynu", a.id);
    const item: Item = {
      id: id(s, "I"),
      product: a.product,
      cost,
      condition: a.condition,
      status: "incoming",
      price: 0,
      views: 0,
      interested: [],
      bottleCondition: a.bottleCondition ?? a.condition,
      boxCondition: a.boxCondition ?? a.condition,
      expectedCondition: a.condition,
    };
    s.items.push(item);
    earn(s, "win:" + a.id, 25);
    const domestic = a.country === "Holandia";
    item.due = s.now + deliveryDuration(s, domestic);
    schedule(s, item.due, "arrival", item.id);
  }
  log(
    s,
    `Aukcja ${a.id} zakończona. ${a.leader === "player" ? "Wygrywasz" : winner ? `Wygrywa ${winner.name}` : "Brak ofert"}${a.leader ? ` za ${(a.price / 100).toFixed(2)} €` : ""}.`,
  );
  if (s.auctions.filter((a) => a.status === "active").length < 14) {
    const pending = s.events.find((e) => !e.done && e.type === "market");
    if (pending && pending.at > s.now + 12000) {
      pending.done = true;
      schedule(s, s.now + 12000, "market", "world");
    }
  }
}
function visit(s: State, p: Person) {
  const hour = amsterdamHour(s.now);
  if (
    hour >= 8 &&
    hour < 22 &&
    !s.threads.some((t) => t.customer === p.id && t.status === "open")
  ) {
    const candidates = s.items.filter(
      (i) =>
        i.status === "listed" &&
        p.favorites.includes(whisky(i.product).category) &&
        i.condition >= p.preferredCondition &&
        !p.owned.includes(i.product),
    );
    candidates.sort(
      (a, b) =>
        a.price / whisky(a.product).value - b.price / whisky(b.product).value,
    );
    const i = candidates[0];
    if (i) {
      i.views++;
      const w = whisky(i.product);
      const max = Math.min(
        available(p),
        customerCeiling(p, w, i.condition, s.reputation),
      );
      const rejected = p.memory.some(
        (m) => m.kind === "rejected" && m.ref === i.id && s.now - m.at < DAY,
      );
      if (
        !rejected &&
        i.price <= max * 1.2 &&
        random(s) <
          Math.min(
            0.95,
            ((w.market.demand * w.market.liquidity) / 10000) *
              (1 + progress(s).upgrades.website * 0.12),
          )
      ) {
        i.interested.push(p.id);
        const offer = Math.min(
          max,
          Math.round((i.price * (1 - p.negotiation * 0.12)) / 100) * 100,
        );
        const t: Thread = {
          id: id(s, "T"),
          customer: p.id,
          item: i.id,
          offer,
          expires: s.now + (1 + p.patience * 10) * 60 * MINUTE,
          status: "open",
          messages: [
            {
              at: s.now,
              from: p.name,
              text: `Interesuje mnie ${w.name}. Proponuję ${(offer / 100).toFixed(2)} € (dostawa w cenie). Mój wybór wynika ze stanu opakowania i ceny.`,
            },
          ],
        };
        s.threads.push(t);
        remember(s, p, "inquiry", i.id, String(offer));
        schedule(s, t.expires, "expire", t.id);
        log(s, `${p.name} pyta o ${w.name}.`);
      } else remember(s, p, "passed", i.id, "Cena lub historia odmowy");
    }
  }
  p.nextVisit =
    s.now +
    ((0.75 + (1 - p.patience) * 1.5 + random(s)) *
      MINUTE *
      paceFactor(s.pace)) /
      (1 + progress(s).upgrades.marketing * 0.2);
  schedule(s, p.nextVisit, "visit", p.id);
}
export function advance(s: State, target: number) {
  progress(s);
  if (target < s.now) {
    s.clockWarning = true;
    return s;
  }
  // Ograniczona porcja chronologicznego odtwarzania; reszta zostaje w kolejce.
  let steps = 0;
  const queue = new EventQueue(s.events);
  queues.set(s, queue);
  while (steps++ < 50000) {
    const e = queue.first?.at <= target ? queue.pop() : undefined;
    if (!e) {
      s.now = target;
      break;
    }
    if (e.done) continue;
    e.done = true;
    if (steps % 1000 === 0) s.events = s.events.filter((event) => !event.done);
    s.now = e.at;
    const a = s.auctions.find((a) => a.id === e.ref);
    const p = s.people.find((p) => p.id === e.actor);
    if (
      e.type === "think" &&
      a &&
      p &&
      a.status === "active" &&
      s.now < a.end
    ) {
      if (
        !p.memory.some((m) => m.kind === "watch" && m.ref === a.id) &&
        p.favorites.includes(whisky(a.product).category)
      ) {
        if (!(a.watchers ??= []).includes(p.id)) a.watchers.push(p.id);
        remember(s, p, "watch", a.id, a.product);
        log(s, `${p.name} obserwuje ${whisky(a.product).name}.`);
      }
      if (a.leader !== p.id) {
        const step = bidStep(a.price);
        const jump = (p.risk ?? 0.3) > 0.75 && p.strategy !== "snipe" ? 2 : 1;
        const amount = a.price + step * jump;
        if (amount <= a.limits[p.id] && totalCost(a, amount) <= available(p))
          bid(s, a.id, p.id, amount);
        else if (
          !p.memory.some((m) => m.kind === "withdraw" && m.ref === a.id)
        ) {
          remember(
            s,
            p,
            "withdraw",
            a.id,
            "Limit ceny lub zarezerwowany budżet",
          );
          log(
            s,
            `${p.name} rezygnuje z aukcji ${a.id}: limit ceny lub budżetu.`,
          );
        }
      }
      const hour = amsterdamHour(s.now);
      const rhythm = hour >= 18 && hour < 23 ? 0.7 : hour < 8 ? 1.7 : 1;
      const interval =
        p.strategy === "snipe" ? 2500 : (1 + p.patience * 3) * MINUTE * rhythm;
      if (s.now + interval < a.end)
        schedule(s, s.now + interval, "think", a.id, p.id);
    } else if (e.type === "reply") {
      const t = s.threads.find((t) => t.id === e.ref);
      if (t?.pendingReply) {
        const pending = t.pendingReply;
        delete t.pendingReply;
        const result = respond(
          s,
          t.id,
          pending.intent,
          "",
          pending.price,
          false,
        );
        log(s, `${s.people.find((p) => p.id === t.customer)?.name}: ${result}`);
      }
    } else if (e.type === "bid") log(s, bid(s, e.ref, e.actor!, e.amount!));
    else if (e.type === "close" && a) {
      if (a.status === "active" && s.now < a.end) {
        if (
          !s.events.some(
            (event) =>
              !event.done &&
              event.type === "close" &&
              event.ref === a.id &&
              event.at === a.end,
          )
        )
          schedule(s, a.end, "close", a.id);
      } else close(s, a);
    } else if (e.type === "arrival") {
      const i = s.items.find((i) => i.id === e.ref);
      if (i?.status === "incoming") {
        i.status = "inspect";
        if (i.expectedCondition !== undefined) {
          const damaged = random(s) < 0.12;
          i.boxCondition = damaged
            ? Math.max(50, (i.boxCondition ?? 100) - 20)
            : i.boxCondition;
          i.condition = Math.min(
            i.bottleCondition ?? i.condition,
            i.boxCondition ?? i.condition,
          );
        }
        log(s, "Dostawa dotarła. Sprawdź butelkę w magazynie.");
      }
    } else if (e.type === "visit") {
      const customer = s.people.find((p) => p.id === e.ref);
      if (customer) visit(s, customer);
    } else if (e.type === "expire") {
      const t = s.threads.find((t) => t.id === e.ref);
      if (t?.status === "open" && t.expires <= s.now) {
        t.status = "expired";
        const c = s.people.find((p) => p.id === t.customer)!;
        c.trust = Math.max(0, c.trust - 0.05);
        remember(s, c, "ignored", t.item, "Przekroczono czas odpowiedzi");
        t.messages.push({
          at: s.now,
          from: c.name,
          text: "Nie otrzymałem odpowiedzi w terminie. Rezygnuję na razie.",
        });
      }
    } else if (e.type === "delivery") {
      const o = s.orders.find((o) => o.id === e.ref);
      if (o?.status === "shipping") {
        const c = s.people.find((p) => p.id === o.customer)!;
        o.status = o.quality < c.preferredCondition ? "complaint" : "delivered";
        o.returnUntil = s.now + 14 * DAY;
        s.items.find((i) => i.id === o.item)!.status = "sold";
        c.owned.push(s.items.find((i) => i.id === o.item)!.product);
        c.trust = Math.min(
          1,
          Math.max(0, c.trust + (o.status === "complaint" ? -0.15 : 0.1)),
        );
        s.reputation = Math.min(
          100,
          Math.max(0, s.reputation + (o.status === "complaint" ? -4 : 2)),
        );
        earn(s, "delivery:" + o.id, o.status === "delivered" ? 50 : 10);
        remember(s, c, o.status, o.id, `Jakość przesyłki: ${o.quality}`);
        log(
          s,
          `Zamówienie ${o.id}: ${o.status === "complaint" ? "reklamacja — niedostateczne zabezpieczenie" : "doręczone"}.`,
        );
      }
    } else if (e.type === "market") {
      const active = s.auctions.filter((a) => a.status === "active").length;
      if (active < 20) {
        const index = chooseMarketProduct(s);
        makeAuction(s, index, s.now + auctionDuration(s, index));
        log(s, `Nowa aukcja: ${catalog[index].name}.`);
      }
      // Top up gradually; no instantaneous wall of identical auctions.
      schedule(s, s.now + marketInterval(s), "market", "world");
      const closed = s.auctions.filter(
        (a) =>
          a.status === "closed" &&
          a.leader !== "player" &&
          !a.watched &&
          !a.bids.some((b) => b.actor === "player"),
      );
      const remove = new Set(
        closed.slice(0, Math.max(0, closed.length - 60)).map((a) => a.id),
      );
      s.auctions = s.auctions.filter((a) => !remove.has(a.id));
    }
    checkAchievements(s);
  }
  s.feed = s.feed.slice(0, 200);
  queues.delete(s);
  s.events = s.events.filter((e) => !e.done);

  return s;
}
export function inspect(s: State, itemId: string) {
  const i = s.items.find((i) => i.id === itemId);
  if (i?.status === "inspect") {
    i.status = "stock";
    earn(s, "inspect:" + i.id, 10);
    log(s, "Towar sprawdzony i przyjęty do magazynu.");
  }
}
export function list(s: State, itemId: string, price: number) {
  const i = s.items.find((i) => i.id === itemId);
  if (
    !i ||
    !["stock", "listed"].includes(i.status) ||
    !Number.isSafeInteger(price) ||
    price <= 0
  )
    return "Nieprawidłowa cena lub status.";
  i.price = price;
  i.status = "listed";
  log(
    s,
    `Wystawiono ${whisky(i.product).name} za ${(price / 100).toFixed(2)} €.`,
  );
  return "Oferta zapisana.";
}
export type Intent =
  | "accept"
  | "reject"
  | "counter"
  | "wait"
  | "photos"
  | "shipping"
  | "refund"
  | "unclear";
export function interpret(text: string): { intent: Intent; price?: number } {
  const t = text.toLowerCase();
  const numbers = [...t.matchAll(/\d+(?:[.,]\d{1,2})?/g)].map((m) =>
    Math.round(Number(m[0].replace(",", ".")) * 100),
  );
  if (numbers.length > 1) return { intent: "unclear" };
  const hits: Intent[] = [];
  if (/zwrot|zwróc/.test(t)) hits.push("refund");
  if (/zdję|fotograf/.test(t)) hits.push("photos");
  if (/wysył|nadani|przesył/.test(t)) hits.push("shipping");
  if (/odmaw|nie zgadz|odrzuc/.test(t)) hits.push("reject");
  else if (/akcept|zgadzam|przyjmuję/.test(t)) hits.push("accept");
  if (/poczek|cierpliwo/.test(t)) hits.push("wait");
  if (numbers.length && hits.length === 0)
    return { intent: "counter", price: numbers[0] };
  if (hits.length !== 1 || (numbers.length && hits[0] !== "refund"))
    return { intent: "unclear" };
  return { intent: hits[0], price: numbers[0] };
}
export function respond(
  s: State,
  threadId: string,
  intent: Intent,
  text = "",
  price?: number,
  appendPlayer = true,
) {
  const t = s.threads.find((t) => t.id === threadId);
  if (!t || t.status !== "open") return "Rozmowa nie jest już aktywna.";
  if (intent === "unclear" || intent === "refund")
    return "Doprecyzuj działanie. Zwroty obsługuj w zamówieniu.";
  const c = s.people.find((p) => p.id === t.customer)!;
  const i = s.items.find((i) => i.id === t.item)!;
  if (i.status !== "listed") return "Ten egzemplarz nie jest już dostępny.";
  if (
    intent === "counter" &&
    (!price || !Number.isSafeInteger(price) || price <= 0)
  )
    return "Podaj prawidłową cenę.";
  if (appendPlayer)
    t.messages.push({
      at: s.now,
      from: "Ty",
      text:
        text ||
        {
          accept: "Akceptuję ofertę.",
          reject: "Odrzucam ofertę.",
          counter: `Proponuję ${(price! / 100).toFixed(2)} €.`,
          wait: "Proszę o cierpliwość.",
          photos: "Stan opakowania potwierdzony w kontroli magazynu.",
          shipping: "Dostawa jest wliczona w ofertę.",
        }[intent],
    });
  if (intent === "reject") {
    t.status = "declined";
    remember(s, c, "rejected", i.id, "Odmowa sklepu");
    c.trust = Math.max(0, c.trust - 0.03);
    return "Odmowa zapisana.";
  }
  if (intent === "wait") {
    if (c.memory.some((m) => m.kind === "wait" && m.ref === t.id))
      return "Klient nie przedłuży terminu ponownie.";
    remember(s, c, "wait", t.id, "Przedłużenie terminu");
    t.expires += c.patience * 2 * 60 * MINUTE;
    schedule(s, t.expires, "expire", t.id);
    return "Termin odpowiedzi przedłużony.";
  }
  if (intent === "photos" || intent === "shipping") {
    t.messages.push({
      at: s.now,
      from: c.name,
      text: "Dziękuję za informację. Czekam na decyzję cenową.",
    });
    return "Wiadomość wysłana.";
  }
  const amount = intent === "accept" ? t.offer : price!;
  const willingness = Math.min(
    c.budget,
    customerCeiling(c, whisky(i.product), i.condition, s.reputation),
  );
  if (amount > willingness) {
    remember(s, c, "counter-rejected", i.id, String(amount));
    t.messages.push({
      at: s.now,
      from: c.name,
      text: "Ta cena przekracza mój limit. Podtrzymuję moją wcześniejszą ofertę.",
    });
    return "Klient odrzucił kontrpropozycję.";
  }
  if (amount > c.budget) return "Klient nie ma już wystarczającego budżetu.";
  c.budget -= amount;
  i.status = "reserved";
  t.status = "accepted";
  const oid = id(s, "O");
  s.orders.push({
    id: oid,
    item: i.id,
    customer: c.id,
    total: amount,
    status: "packing",
    packed: false,
    due: 0,
    returnUntil: 0,
    quality: i.condition,
    refund: 0,
  });
  post(s, oid + "payment", amount, "Wpłata klienta", oid);
  post(s, oid + "fee", -Math.round(amount * 0.025), "Prowizja płatnicza", oid);
  remember(s, c, "purchase", i.id, String(amount));
  for (const other of s.threads.filter(
    (x) => x.item === i.id && x.id !== t.id && x.status === "open",
  )) {
    other.status = "declined";
    other.messages.push({
      at: s.now,
      from: "Sklep",
      text: "Egzemplarz został sprzedany.",
    });
  }
  t.messages.push({
    at: s.now,
    from: c.name,
    text: `Zgadzam się na ${(amount / 100).toFixed(2)} € z dostawą. Proszę przygotować zamówienie.`,
  });
  earn(s, "sale:" + oid, 35);
  log(s, `Nowe zamówienie ${oid} od ${c.name}.`);
  return "Sprzedaż potwierdzona. Zapakuj i nadaj zamówienie.";
}
export function pack(s: State, orderId: string) {
  const o = s.orders.find((o) => o.id === orderId);
  if (o?.status === "packing") o.packed = true;
}
export function ship(s: State, orderId: string) {
  const o = s.orders.find((o) => o.id === orderId);
  if (!o || o.status !== "packing")
    return "Zamówienie nie oczekuje na nadanie.";
  if (cash(s) - held(s) < 950) return "Brak wolnej gotówki na etykietę.";
  post(s, o.id + "shipping", -950, "Wysyłka do klienta", o.id);
  const improvements = progress(s).upgrades;
  o.quality -= o.packed
    ? random(s) <
      0.09 *
        (1 - improvements.packing * 0.22) *
        (1 - improvements.warehouse * 0.12)
      ? 15
      : 0
    : 25;
  o.status = "shipping";
  o.due = s.now + deliveryDuration(s, true);
  schedule(s, o.due, "delivery", o.id);
  return "Nadano przesyłkę w lokalnym symulatorze.";
}
export function refund(s: State, orderId: string, amount: number) {
  const o = s.orders.find((o) => o.id === orderId);
  if (
    !o ||
    !["delivered", "complaint"].includes(o.status) ||
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    amount > o.total - o.refund
  )
    return "Nieprawidłowy zwrot.";
  if (amount > cash(s) - held(s)) return "Brak wolnej gotówki na zwrot.";
  post(s, id(s, "R"), -amount, "Zwrot klientowi", o.id);
  o.refund += amount;
  const c = s.people.find((p) => p.id === o.customer)!;
  c.budget += amount;
  c.trust = Math.min(1, c.trust + 0.1);
  remember(s, c, "refund", o.id, String(amount));
  if (o.refund === o.total) {
    o.status = "returned";
    const i = s.items.find((i) => i.id === o.item)!;
    i.status = "incoming";
    c.owned = c.owned.filter((p) => p !== i.product);
    i.due = s.now + deliveryDuration(s, true);
    schedule(s, i.due, "arrival", i.id);
  }
  return "Zwrot zaksięgowany. Częściowa ugoda nie usuwa prawa odstąpienia.";
}
export function financials(s: State) {
  const developmentCost = -s.ledger
    .filter((l) => l.type === "Ulepszenie sklepu")
    .reduce((n, l) => n + l.amount, 0);
  const completed = s.orders.filter((o) =>
    ["delivered", "complaint", "returned"].includes(o.status),
  );
  return {
    stock: s.items
      .filter((i) => ["stock", "inspect", "listed"].includes(i.status))
      .reduce((n, i) => n + i.cost, 0),
    incoming: s.items
      .filter((i) => i.status === "incoming")
      .reduce((n, i) => n + i.cost, 0),
    liabilities: s.orders
      .filter((o) => ["packing", "shipping"].includes(o.status))
      .reduce((n, o) => n + o.total - o.refund, 0),
    developmentCost,
    profit:
      completed.reduce(
        (n, o) =>
          n +
          o.total -
          o.refund -
          Math.round(o.total * 0.025) -
          950 -
          (o.status === "returned"
            ? 0
            : s.items.find((i) => i.id === o.item)!.cost),
        0,
      ) - developmentCost,
  };
}

const hourFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Amsterdam",
  hour: "2-digit",
  hourCycle: "h23",
});
function amsterdamHour(at: number) {
  return Number(hourFormatter.format(at));
}

/** Public UI command: customer decisions are queued, serialized and replayable. */
export function sendResponse(
  s: State,
  threadId: string,
  intent: Intent,
  text = "",
  price?: number,
) {
  const t = s.threads.find((t) => t.id === threadId);
  if (!t || t.status !== "open") return "Rozmowa nie jest już aktywna.";
  if (t.pendingReply)
    return "Wiadomość została wysłana. Poczekaj na odpowiedź klienta.";
  if (intent === "unclear" || intent === "refund")
    return "Doprecyzuj działanie. Zwroty obsługuj w zamówieniu.";
  if (
    intent === "counter" &&
    (!Number.isSafeInteger(price) || !price || price <= 0)
  )
    return "Podaj prawidłową cenę.";
  if (!s.items.some((i) => i.id === t.item && i.status === "listed"))
    return "Ten egzemplarz nie jest już dostępny.";
  const c = s.people.find((p) => p.id === t.customer)!;
  const descriptions: Record<Exclude<Intent, "unclear" | "refund">, string> = {
    accept: "Akceptuję ofertę.",
    reject: "Odrzucam ofertę.",
    counter: `Proponuję ${((price ?? 0) / 100).toFixed(2)} € z dostawą.`,
    wait: "Proszę o cierpliwość.",
    photos: "Potwierdzam wynik kontroli stanu opakowania.",
    shipping: "Dostawa jest wliczona w ofertę.",
  };
  t.messages.push({
    at: s.now,
    from: "Ty",
    text: text || descriptions[intent],
  });
  const style = c.responseStyle ?? "typical";
  if (style === "silent" && c.trust < 0.6) {
    remember(
      s,
      c,
      "silent",
      t.id,
      "Brak odpowiedzi: niskie zaufanie i wycofany styl",
    );
    return "Wiadomość wysłana. Klient może nie odpowiedzieć.";
  }
  const seconds =
    style === "fast"
      ? 15 + random(s) * 30
      : style === "slow"
        ? 300 + random(s) * 600
        : 45 + random(s) * 75;
  const delay = Math.round(seconds * 1000 * paceFactor(s.pace));
  t.pendingReply = { intent, price, at: s.now + delay };
  schedule(s, t.pendingReply.at, "reply", t.id);
  return "Wiadomość wysłana. Klient odpowie po zapoznaniu się z propozycją.";
}
export function markRead(s: State, threadId: string) {
  const t = s.threads.find((t) => t.id === threadId);
  if (t) t.readAt = s.now;
}
export function unreadCount(t: Thread) {
  return t.messages.filter((m) => m.from !== "Ty" && m.at > (t.readAt ?? 0))
    .length;
}

export function bidStep(price: number) {
  return price < 10000
    ? 500
    : price < 30000
      ? 1000
      : price < 100000
        ? 2000
        : 5000;
}
export function auctionDuration(
  s: State,
  index = Math.floor(random(s) * catalog.length),
) {
  const rarity = catalog[index].rarity;
  const [min, max] = rarity >= 8 ? [6, 10] : rarity >= 5 ? [4, 6] : [2, 4];
  return Math.round((min + random(s) * (max - min)) * MINUTE);
}
function marketInterval(s: State) {
  const active = s.auctions.filter((a) => a.status === "active").length;
  const factor = paceFactor(s.pace);
  return Math.round(
    (active < 12
      ? 4 + random(s) * 4
      : active < 16
        ? 10 + random(s) * 6
        : 30 + random(s) * 30) *
      1000 *
      factor,
  );
}
export function deliveryDuration(s: State, domestic: boolean) {
  const base = domestic ? 3 + random(s) * 5 : 6 + random(s) * 9;
  const delay = random(s) < 0.08 ? 5 + random(s) * 10 : 0;
  return Math.round((base + delay) * MINUTE * paceFactor(s.pace));
}
export function setPace(s: State, pace: Pace) {
  if (!["Spokojne", "Dynamiczne", "Intensywne"].includes(pace)) return;
  s.pace = pace;
  s.events = s.events.filter((e) => e.type !== "market");
  schedule(s, s.now + marketInterval(s), "market", "world");
  return `Tempo: ${pace}. Wpływa na nowe wydarzenia, nie ceny ani trwające terminy.`;
}
export function watchAuction(s: State, id: string) {
  const a = s.auctions.find((a) => a.id === id);
  if (a) a.watched = !a.watched;
}
export function setBidLimit(s: State, id: string, limit: number | undefined) {
  const a = s.auctions.find((a) => a.id === id);
  if (!a) return;
  if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0))
    return "Nieprawidłowy limit.";
  a.playerLimit = limit;
  return limit === undefined ? "Limit usunięty." : "Limit licytacji zapisany.";
}
export function supplierClaim(s: State, id: string) {
  const i = s.items.find((i) => i.id === id);
  if (
    !i ||
    i.supplierClaim ||
    i.expectedCondition === undefined ||
    i.condition >= i.expectedCondition
  )
    return "Brak niezgodności do zgłoszenia.";
  i.supplierClaim = "resolved";
  const amount = Math.round(
    (i.cost * (i.expectedCondition - i.condition)) / 200,
  );
  post(s, "supplier-" + i.id, amount, "Ugoda ze sprzedawcą aukcyjnym", i.id);
  i.cost -= amount;
  return "Niezgodność potwierdzona. Zaksięgowano rekompensatę za obniżony stan.";
}
const extraNames = [
  "AmberArchivist",
  "RotterdamMalt",
  "RareDramFR",
  "IslayMarek",
  "OsloCollector",
  "BerlinBlend",
  "OldLabelFan",
  "LisbonCasks",
  "HighlandAnna",
  "ParisReserve",
  "DublinBottle",
  "MilanMalt",
  "NordicWalker",
  "PragueDram",
  "ViennaVintage",
  "MadridGold",
  "BaselBlue",
  "BrusselsBarrel",
  "PortoLabel",
  "HelsinkiMalt",
  "EdinburghVault",
  "GdanskCollector",
  "CopenhagenCask",
  "LyonVintage",
  "RomeReserve",
  "StockholmBlue",
  "WarsawWalker",
  "ZagrebDram",
  "TallinnMalt",
  "RigaCollector",
];
export function addBidders(s: State) {
  extraNames.forEach((name, i) => {
    const id = "bidder-" + i;
    if (s.people.some((p) => p.id === id)) return;
    const country = [
      "Holandia",
      "Belgia",
      "Niemcy",
      "Francja",
      "Polska",
      "Włochy",
    ][i % 6];
    s.people.push({
      id,
      name,
      city: country,
      country,
      role: "bidder",
      budget: 60000 + i * 9000,
      reserved: 0,
      favorites: [["standard", "blue", "vintage", "travel"][i % 4]],
      patience: 0.2 + random(s) * 0.75,
      sensitivity: 0.25 + random(s) * 0.65,
      negotiation: random(s),
      trust: 0.5,
      strategy: i % 3 === 0 ? "early" : i % 3 === 1 ? "measured" : "snipe",
      memory: [],
      owned: [],
      nextVisit: s.now,
      preferredCondition: 80,
      risk: random(s),
    });
  });
  s.people
    .filter((p) => p.role === "bidder")
    .forEach((p, i) => {
      p.country ??= ["Holandia", "Holandia", "Belgia", "Niemcy", "Belgia"][
        i % 5
      ];
      p.risk ??= 0.3;
    });
  s.people.forEach((p, i) => {
    const matching = catalog.filter((w) => p.favorites.includes(w.category));
    p.favoriteEditions ??= [matching[i % matching.length].id];
  });
  s.people
    .filter((p) => p.role === "customer")
    .forEach((p, i) => {
      p.responseStyle ??= (
        ["fast", "typical", "slow", "silent", "typical"] as const
      )[i % 5];
    });
}
export function migrateGame(input: unknown): State {
  const s = input as Omit<State, "version"> & { version: number };
  if (s.version === 2) return s as State;
  if (s.version !== 1) throw Error("Nieobsługiwana wersja zapisu.");
  s.version = 2;
  s.pace = "Dynamiczne";
  addBidders(s as State);
  // Existing bids, money, ledger and delivery deadlines are preserved.
  s.events = s.events.filter((e) => !e.done && e.type !== "market");
  schedule(s as State, s.now + 30000, "market", "world");
  return s as State;
}

function customerCeiling(
  p: Person,
  w: (typeof catalog)[number],
  condition: number,
  reputation: number,
) {
  const raw =
    1.35 -
    p.sensitivity * 0.35 +
    (p.trust - 0.5) * 0.2 +
    (reputation - 50) / 500;
  const cap = w.market.availability === "common" ? 1.06 : 1.4;
  return Math.floor((w.value * Math.min(raw, cap) * condition) / 100);
}
/** Availability controls frequency; demand and liquidity affect people, not rarity. */
export function chooseMarketProduct(
  s: State,
  availability?: MarketData["availability"],
) {
  const active = s.auctions.filter((a) => a.status === "active");
  const ids = new Map<string, number>(),
    categories = new Map<string, number>();
  for (const a of active) {
    ids.set(a.product, (ids.get(a.product) ?? 0) + 1);
    const category = whisky(a.product).category;
    categories.set(category, (categories.get(category) ?? 0) + 1);
  }
  const weights = catalog.map((w) => {
    if (availability && w.market.availability !== availability) return 0;
    const base = {
      common: 8,
      moderate: 5,
      limited: 3,
      scarce: 1.3 * (1 + progress(s).upgrades.contacts * 0.25),
    }[w.market.availability];
    const duplicates = ids.get(w.id) ?? 0;
    const categoryLoad = categories.get(w.category) ?? 0;
    const regional =
      w.market.regions.includes("US") && !w.market.regions.includes("NL")
        ? 0.45
        : 1;
    return (
      ((base *
        regional *
        (progress(s).upgrades.contacts >= 2 && w.category === "travel"
          ? 1.2
          : 1) *
        (progress(s).upgrades.contacts >= 3 && w.category === "blue"
          ? 1.15
          : 1)) /
        (1 + duplicates * 4)) *
      (categoryLoad >= 5 ? 0.3 : 1)
    );
  });
  let draw = random(s) * weights.reduce((n, v) => n + v, 0);
  for (let i = 0; i < weights.length; i++) {
    draw -= weights[i];
    if (draw < 0) return i;
  }
  return weights.findIndex((v) => v > 0);
}
function extendAuction(s: State, a: Auction, actor: string) {
  const oldEnd = a.end;
  a.end += 15000;
  (a.extensions ??= []).push({ at: s.now, actor, oldEnd, newEnd: a.end });
  // Invalidate all old deadlines; the close handler also guards against stale imported events.
  for (const event of s.events)
    if (!event.done && event.type === "close" && event.ref === a.id)
      event.done = true;
  schedule(s, a.end, "close", a.id);
  log(s, `+15 SEKUND — AUKCJA ${a.id} PRZEDŁUŻONA!`);
  // People who had no remaining decision before the old deadline may now reconsider.
  for (const actorId of Object.keys(a.limits)) {
    const p = s.people.find((p) => p.id === actorId);
    if (!p) continue;
    if (p.strategy === "snipe")
      for (const event of s.events)
        if (
          !event.done &&
          event.type === "think" &&
          event.ref === a.id &&
          event.actor === actorId
        )
          event.done = true;
    if (
      actorId === a.leader ||
      s.events.some(
        (e) =>
          !e.done &&
          e.type === "think" &&
          e.ref === a.id &&
          e.actor === actorId,
      )
    )
      continue;
    if (
      a.price + bidStep(a.price) > a.limits[actorId] ||
      totalCost(a, a.price + bidStep(a.price)) > available(p)
    )
      continue;
    const at =
      p.strategy === "snipe"
        ? a.end - 2000 - Math.floor(random(s) * 4000)
        : s.now + 1000 + Math.round(p.patience * 3000);
    schedule(s, at, "think", a.id, p.id);
  }
}

export function watcherCount(s: State, a: Auction) {
  return new Set([
    ...(a.watchers ?? []),
    ...a.bids.map((b) => b.actor),
    ...(a.watched ? ["player"] : []),
  ]).size;
}
