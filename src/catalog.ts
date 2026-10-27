import data from "./catalog-data.json" with { type: "json" };
export interface MarketData {
  referenceRetailCents: number;
  auctionMinCents: number | null;
  auctionMaxCents: number | null;
  availability: "common" | "moderate" | "limited" | "scarce";
  rarity: number;
  demand: number;
  liquidity: number;
  productionStatus: "current" | "discontinued" | "unknown";
  regions: string[];
  lastVerified: string | null;
  sources: string[];
  referenceKind: "game-balance" | "verified-retail";
  lastReviewed: string;
}
export interface Whisky {
  id: string;
  name: string;
  category: "standard" | "blue" | "vintage" | "travel";
  /** Legacy aliases for the existing economy and save IDs. */
  value: number;
  rarity: number;
  description: string;
  collectorNote?: string;
  releaseYear?: number;
  volumeMl?: number;
  abv?: number;
  ageStatement?: number;
  sourceUrl?: string;
  balanceNote?: string;
  market: MarketData;
}
export const catalog: Whisky[] = (
  data as Omit<Whisky, "value" | "rarity">[]
).map((w) => ({
  ...w,
  value: w.market.referenceRetailCents,
  rarity: w.market.rarity,
}));
export const whisky = (id: string) => catalog.find((w) => w.id === id)!;
export const categoryLabel = (w: Whisky) =>
  w.name.includes("Ghost & Rare")
    ? "Ghost & Rare"
    : w.id === "centenary" || w.id === "honour"
      ? "Historyczne edycje"
      : w.category === "travel"
        ? "Travel Retail"
        : w.name.includes("Year of")
          ? "Limitowane opakowania"
          : w.category === "blue"
            ? "Blue Label"
            : w.category === "vintage"
              ? "Vintage"
              : w.market.productionStatus === "discontinued"
                ? "Wycofane edycje"
                : "Standardowe wydania";
export const availabilityLabel = {
  common: "Powszechna",
  moderate: "Średnia",
  limited: "Ograniczona",
  scarce: "Niska",
};
export const euro = (n: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "EUR" }).format(
    n / 100,
  );
export const productSpecs = (w: Whisky) =>
  [
    w.volumeMl ? `${w.volumeMl} ml` : "Pojemność niepotwierdzona",
    w.abv ? `${w.abv}%` : null,
    w.ageStatement ? `${w.ageStatement} lat` : null,
  ]
    .filter(Boolean)
    .join(" · ");
export { productMedia } from "./media";
