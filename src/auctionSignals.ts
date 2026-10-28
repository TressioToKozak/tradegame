import type { Auction } from "./engine";
import { whisky } from "./catalog";
export function auctionSignals(a: Auction, now: number) {
  if (a.status !== "active" || a.end <= now) return [];
  const recent = a.bids.filter(b => b.at <= now && now-b.at <= 60000);
  return [
    ...(a.end-now <= 60000 ? ["Kończy się"] : []),
    ...(a.createdAt !== undefined && a.createdAt <= now && now-a.createdAt <= 120000 ? ["Nowa"] : []),
    ...(whisky(a.product).rarity >= 7 ? ["Rzadka"] : []),
    ...(a.watched ? ["Obserwowana"] : []),
    ...(recent.length >= 3 && new Set(recent.map(b => b.actor)).size >= 2 ? ["Gorąca"] : []),
  ];
}
