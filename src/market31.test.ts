import {it,expect} from 'vitest';
import {whisky,catalog} from './catalog';
import {estimatedHammerValue} from './market';
import {createGame,makeAuction,totalCost,MINUTE} from './engine';
it('skrajny wynik nie podnosi wyceny NPC ponad medianę zgodnych sprzedaży',()=>{
 const w=structuredClone(whisky('brora'));w.market.observedAuctionCents=50000;w.market.auctionMinCents=40000;w.market.auctionMaxCents=500000;w.market.pricingNeedsReview=false;expect(estimatedHammerValue(w)).toBe(50000);w.market.auctionMaxCents=5000000;expect(estimatedHammerValue(w)).toBe(50000);w.market.rarity=10;expect(estimatedHammerValue(w)).toBe(50000);
});
it('cena otwarcia i limity pozostają ostrożne mimo zawyżonego maksimum obserwacji',()=>{
 const s=createGame(Date.UTC(2026,9,28,12),42),w=whisky('brora'),saved=structuredClone(w.market);try{
  w.market.observedAuctionCents=50000;w.market.auctionMinCents=10000;w.market.auctionMaxCents=5000000;w.market.pricingNeedsReview=false;
  for(let n=0;n<8;n++){makeAuction(s,catalog.findIndex(w=>w.id==='brora'),s.now+5*MINUTE);const a=s.auctions.at(-1)!;expect(a.price).toBeLessThan(50000);for(const limit of Object.values(a.limits))if(limit>0)expect(totalCost(a,limit)).toBeLessThanOrEqual(85000);}
 }finally{Object.assign(w.market,saved);}
});
