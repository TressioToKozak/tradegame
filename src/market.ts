import type { Whisky } from "./catalog";
/** Hammer prices exclude fees and transport. No rarity multiplier and no fabricated sale records. */
export function auctionRange(w: Whisky) {
  const m = w.market;
  if (
    m.auctionMinCents !== null &&
    m.auctionMaxCents !== null &&
    m.lastVerified &&
    m.sources.length
  )
    return { min: m.auctionMinCents, max: m.auctionMaxCents, estimated: false };
  // Conservative fallback: liquidity and demand constrain what can actually sell.
  const resale = {
    common: [0.42, 0.78],
    moderate: [0.45, 0.88],
    limited: [0.42, 0.95],
    scarce: [0.38, 1.0],
  }[m.availability];
  const liquidity = 0.8 + m.liquidity / 500;
  const demand = 0.9 + m.demand / 1000;
  return {
    min: Math.round(w.value * resale[0] * liquidity * demand),
    max: Math.round(w.value * resale[1] * liquidity * demand),
    estimated: true,
  };
}
export function estimatedHammerValue(w: Whisky, bottle = 100, box = 100) {
  const r = auctionRange(w);
  return Math.round(
    (r.min + (r.max - r.min) * 0.7) *
      (bottle / 100) *
      (0.8 + Math.max(0, box) / 500),
  );
}
