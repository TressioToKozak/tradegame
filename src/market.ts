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
  // One matching sale is a reference point, never an invented observed range.
  if (m.observedAuctionCents && m.sourceQuote?.kind === "auction-result")
    return {
      min: Math.round(m.observedAuctionCents * 0.75),
      max: Math.round(m.observedAuctionCents * 1.1),
      estimated: true,
    };
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
export function conditionValueFactor(w: Whisky, bottle = 100, box = 100) {
  const premium = w.market.boxPremiumRate ?? 0.25;
  return (
    ((Math.max(0, Math.min(100, bottle)) / 100) *
      (1 + (premium * Math.max(0, Math.min(100, box))) / 100)) /
    (1 + premium)
  );
}
export function estimatedHammerValue(w: Whisky, bottle = 100, box = 100) {
  const r = auctionRange(w);
  // The median of matching sales is a valuation anchor; an isolated high result must not inflate everyone's ceiling.
  const observed=w.market.observedAuctionCents;
  const center=observed!==null && observed!==undefined ? observed : Math.min(w.value,r.min+(r.max-r.min)*.55);
  const caution=w.market.pricingNeedsReview && observed ? .9 : 1;
  return Math.round(center*caution*conditionValueFactor(w,bottle,box));
}
