import type { State } from "./engine";
export type Upgrade =
  | "warehouse"
  | "packing"
  | "website"
  | "marketing"
  | "contacts";
export interface Progression {
  xp: number;
  awarded: string[];
  upgrades: Record<Upgrade, number>;
  achievements: string[];
}
export const upgrades: {
  id: Upgrade;
  name: string;
  detail: string;
  cost: number;
  level: number;
}[] = [
  {
    id: "warehouse",
    name: "Lepszy magazyn",
    detail:
      "+12 miejsc na butelki na stopień; bezpieczniejsze przygotowanie paczek.",
    cost: 18000,
    level: 1,
  },
  {
    id: "packing",
    name: "Profesjonalne pakowanie",
    detail: "Mniejsze ryzyko uszkodzenia zabezpieczonej przesyłki.",
    cost: 12000,
    level: 1,
  },
  {
    id: "website",
    name: "Witryna kolekcjonerska",
    detail: "Większe zainteresowanie ofertami pasującymi do klienta.",
    cost: 16000,
    level: 2,
  },
  {
    id: "marketing",
    name: "Marketing kolekcjonerski",
    detail: "Częstsze wizyty istniejących klientów; bez gwarancji sprzedaży.",
    cost: 22000,
    level: 3,
  },
  {
    id: "contacts",
    name: "Sieć kontaktów",
    detail: "Większa szansa dostępu do trudno dostępnych partii.",
    cost: 25000,
    level: 2,
  },
];
export const achievements = [
  {
    id: "first-buy",
    name: "Pierwsza zdobycz",
    detail: "Wygraj pierwszą aukcję.",
  },
  {
    id: "first-sale",
    name: "Drzwi otwarte",
    detail: "Przyjmij pierwsze zamówienie.",
  },
  {
    id: "trusted",
    name: "Dobre imię",
    detail: "Doręcz 5 zamówień bez reklamacji.",
  },
  { id: "collector", name: "Własna kolekcja", detail: "Kup 10 butelek." },
  { id: "developer", name: "Krok naprzód", detail: "Kup pierwsze ulepszenie." },
];
export function progress(s: State): Progression {
  if (!s.progression) {
    s.progression = {
      xp: 0,
      awarded: [],
      upgrades: {
        warehouse: 0,
        packing: 0,
        website: 0,
        marketing: 0,
        contacts: 0,
      },
      achievements: [],
    };
    // Recover completed business actions from existing records, without touching money or deadlines.
    for (const a of s.auctions)
      if (a.status === "closed" && a.leader === "player")
        earn(s, "win:" + a.id, 25);
    for (const i of s.items)
      if (["stock", "listed", "reserved", "sold"].includes(i.status))
        earn(s, "inspect:" + i.id, 10);
    for (const o of s.orders) {
      earn(s, "sale:" + o.id, 35);
      if (["delivered", "complaint", "returned"].includes(o.status))
        earn(s, "delivery:" + o.id, o.status === "delivered" ? 50 : 10);
    }
  }
  return s.progression;
}
export function earn(s: State, key: string, xp: number) {
  const p = progress(s);
  if (p.awarded.includes(key)) return;
  p.awarded.push(key);
  p.xp += xp;
}
export const shopLevel = (s: State) =>
  Math.floor(Math.sqrt(progress(s).xp / 100)) + 1;
export const levelStart = (level: number) => 100 * (level - 1) ** 2;
export const capacity = (s: State) => 24 + progress(s).upgrades.warehouse * 12;
export const upgradeCost = (s: State, id: Upgrade) =>
  upgrades.find((u) => u.id === id)!.cost * (progress(s).upgrades[id] + 1);
export function buyUpgrade(s: State, id: Upgrade) {
  const u = upgrades.find((u) => u.id === id);
  if (!u) return "Nieznane ulepszenie.";
  const p = progress(s),
    tier = p.upgrades[id];
  if (tier >= 3) return "Osiągnięto maksymalny stopień.";
  if (shopLevel(s) < u.level) return `Wymagany poziom sklepu: ${u.level}.`;
  const free =
    s.ledger.reduce((n, l) => n + l.amount, 0) -
    s.auctions
      .filter((a) => a.status === "active" && a.leader === "player")
      .reduce(
        (n, a) => n + a.price + Math.round(a.price * a.fee) + a.shipping,
        0,
      );
  const cost = upgradeCost(s, id);
  if (free < cost) return "Brak wolnej gotówki na ulepszenie.";
  s.ledger.push({
    id: `upgrade:${id}:${tier + 1}`,
    at: s.now,
    amount: -cost,
    type: "Ulepszenie sklepu",
    ref: id,
  });
  p.upgrades[id]++;
  s.feed.unshift({
    at: s.now,
    text: `Ulepszenie: ${u.name}, stopień ${tier + 1}.`,
  });
  checkAchievements(s);
  return `${u.name}: stopień ${tier + 1}.`;
}
export function checkAchievements(s: State) {
  const p = progress(s),
    won = p.awarded.filter((k) => k.startsWith("win:")).length;
  const conditions: Record<string, boolean> = {
    "first-buy": won >= 1,
    "first-sale": s.orders.length >= 1,
    trusted:
      s.orders.filter((o) => o.status === "delivered" && o.refund === 0)
        .length >= 5,
    collector: won >= 10,
    developer: Object.values(p.upgrades).some((n) => n > 0),
  };
  for (const a of achievements)
    if (conditions[a.id] && !p.achievements.includes(a.id)) {
      p.achievements.push(a.id);
      s.feed.unshift({ at: s.now, text: `Osiągnięcie: ${a.name}.` });
    }
}

export const tradeContacts = [
  {
    id: "noor",
    name: "Noor van Dijk",
    country: "Holandia",
    specialty: "Holenderskie kolekcje",
    tier: 1,
  },
  {
    id: "luc",
    name: "Luc Vermeulen",
    country: "Belgia",
    specialty: "Travel Retail i starsze butelkowania",
    tier: 2,
  },
  {
    id: "marta",
    name: "Marta König",
    country: "Niemcy",
    specialty: "Edycje kolekcjonerskie",
    tier: 3,
  },
];
export const unlockedContacts = (s: State) =>
  tradeContacts.filter((c) => c.tier <= progress(s).upgrades.contacts);
