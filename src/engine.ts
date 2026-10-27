import { catalog, whisky } from "./catalog";
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
}
export interface Auction {
  id: string;
  product: string;
  end: number;
  price: number;
  leader: string | null;
  status: "active" | "closed";
  fee: number;
  shipping: number;
  condition: number;
  country: string;
  limits: Record<string, number>;
  bids: { at: number; actor: string; amount: number }[];
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
  version: 1;
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
const schedule = (
  s: State,
  at: number,
  type: Event["type"],
  ref: string,
  actor?: string,
  amount?: number,
) =>
  s.events.push({ id: ++s.serial, at, type, ref, actor, amount, done: false });
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
): State {
  const s: State = {
    version: 1,
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
      nextVisit: now + (i - 4) * 15 * MINUTE,
      preferredCondition: i % 3 === 0 ? 100 : 80,
    }),
  );
  post(s, "opening", 500000, "Kapitał początkowy", "company");
  [6, 10, 15].forEach((p, i) => makeAuction(s, p, now + (6 + i * 3) * MINUTE));
  s.people
    .filter((p) => p.role === "customer")
    .forEach((p) => schedule(s, p.nextVisit, "visit", p.id));
  schedule(s, now + 6 * 60 * MINUTE, "market", "world");
  log(s, "Sklep otwarty. Kapitał początkowy: 5 000 €.");
  return s;
}
function makeAuction(s: State, index: number, end: number) {
  const w = catalog[index];
  const a: Auction = {
    id: id(s, "A"),
    product: w.id,
    end,
    price: Math.round((w.value * 0.45) / 100) * 100,
    leader: null,
    status: "active",
    fee: 0.12,
    shipping: 1500,
    condition: 100,
    country: ["Holandia", "Belgia", "Niemcy"][index % 3],
    limits: {},
    bids: [],
  };
  s.auctions.push(a);
  for (const p of s.people.filter((p) => p.role === "bidder")) {
    const interest = p.favorites.includes(w.category) ? 1 : 0.55;
    const duplicate = p.owned.includes(w.id) ? 0.65 : 1;
    const losses = p.memory.filter(
      (m) => m.kind === "lost" && m.detail === w.id,
    ).length;
    const difficulty = ["Łatwa", "Normalna", "Realistyczna", "Ekspert"].indexOf(
      s.difficulty,
    );
    a.limits[p.id] = Math.floor(
      w.value *
        interest *
        duplicate *
        (1.24 - p.sensitivity * 0.4 + Math.min(losses, 3) * 0.03) *
        (0.9 + difficulty * 0.05),
    );
    const at =
      p.strategy === "snipe"
        ? end - 2000 - Math.floor(random(s) * 14000)
        : s.now +
          Math.floor((end - s.now) * (p.strategy === "early" ? 0.08 : 0.45));
    schedule(s, at, "think", a.id, p.id);
  }
  schedule(s, end, "close", a.id);
}
export function bid(
  s: State,
  auctionId: string,
  actor: string,
  amount: number,
) {
  const a = s.auctions.find((a) => a.id === auctionId);
  if (!a || a.status !== "active" || s.now >= a.end) return "Oferta spóźniona.";
  if (!Number.isSafeInteger(amount) || amount < a.price + 500)
    return "Minimalne przebicie wynosi 5 €.";
  if (a.leader === actor) return "Już prowadzisz w tej aukcji.";
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
    winner.owned.push(a.product);
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
    };
    s.items.push(item);
    schedule(s, s.now + DAY, "arrival", item.id);
  }
  log(
    s,
    `Aukcja ${a.id} zakończona. ${a.leader === "player" ? "Wygrywasz" : winner ? `Wygrywa ${winner.name}` : "Brak ofert"}${a.leader ? ` za ${(a.price / 100).toFixed(2)} €` : ""}.`,
  );
}
function visit(s: State, p: Person) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "Europe/Amsterdam",
    }).format(s.now),
  );
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
      const tolerance =
        1.35 -
        p.sensitivity * 0.35 +
        (p.trust - 0.5) * 0.2 +
        (s.reputation - 50) / 500;
      const max = Math.min(
        available(p),
        Math.floor((w.value * tolerance * i.condition) / 100),
      );
      const rejected = p.memory.some(
        (m) => m.kind === "rejected" && m.ref === i.id && s.now - m.at < DAY,
      );
      if (!rejected && i.price <= max * 1.2) {
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
  p.nextVisit = s.now + (6 + (1 - p.patience) * 18) * 60 * MINUTE;
  schedule(s, p.nextVisit, "visit", p.id);
}
export function advance(s: State, target: number) {
  if (target < s.now) {
    s.clockWarning = true;
    return s;
  }
  // Ograniczona porcja chronologicznego odtwarzania; reszta zostaje w kolejce.
  let steps = 0;
  while (steps++ < 20000) {
    const e = s.events
      .filter((e) => !e.done && e.at <= target)
      .sort((a, b) => a.at - b.at || a.id - b.id)[0];
    if (!e) {
      s.now = target;
      break;
    }
    e.done = true;
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
        remember(s, p, "watch", a.id, a.product);
        log(s, `${p.name} obserwuje ${whisky(a.product).name}.`);
      }
      if (a.leader !== p.id) {
        const amount = a.price + 500;
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
    else if (e.type === "close" && a) close(s, a);
    else if (e.type === "arrival") {
      const i = s.items.find((i) => i.id === e.ref);
      if (i?.status === "incoming") {
        i.status = "inspect";
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
        remember(s, c, o.status, o.id, `Jakość przesyłki: ${o.quality}`);
        log(
          s,
          `Zamówienie ${o.id}: ${o.status === "complaint" ? "reklamacja — niedostateczne zabezpieczenie" : "doręczone"}.`,
        );
      }
    } else if (e.type === "market") {
      makeAuction(
        s,
        Math.floor(random(s) * catalog.length),
        s.now + 8 * MINUTE,
      );
      schedule(s, s.now + 6 * 60 * MINUTE, "market", "world");
      log(s, "Nowa aukcja na rynku kolekcjonerskim.");
    }
  }
  return s;
}
export function inspect(s: State, itemId: string) {
  const i = s.items.find((i) => i.id === itemId);
  if (i?.status === "inspect") {
    i.status = "stock";
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
    Math.floor(
      (whisky(i.product).value *
        (1.35 -
          c.sensitivity * 0.35 +
          (c.trust - 0.5) * 0.2 +
          (s.reputation - 50) / 500) *
        i.condition) /
        100,
    ),
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
  o.quality -= o.packed ? 0 : 25;
  o.status = "shipping";
  o.due = s.now + 2 * DAY;
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
    schedule(s, s.now + 2 * DAY, "arrival", i.id);
  }
  return "Zwrot zaksięgowany. Częściowa ugoda nie usuwa prawa odstąpienia.";
}
export function financials(s: State) {
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
    profit: completed.reduce(
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
    ),
  };
}

function amsterdamHour(at: number) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Amsterdam",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(at),
  );
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
  const delay = Math.round((45 + c.patience * 120 + random(s) * 75) * 1000);
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
