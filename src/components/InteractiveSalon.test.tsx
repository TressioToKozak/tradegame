import { describe, it, expect } from "vitest";
import { createGame } from "../engine";
import { salonActivity } from "./InteractiveSalon";
describe("Salon odzwierciedla zapisany świat", () => {
  it("nie wymyśla alertów, rozpoznaje przesyłki i otwarte propozycje oraz usuwa nieaktualne", () => {
    const s = createGame(1700000000000, 42);
    expect(Object.values(salonActivity(s)).every(a => !a.active)).toBe(true);
    s.auctions[0].watched = true; s.auctions[0].end = s.now + 28000;
    s.items.push({ id:"salon-item", product:"blue", cost:10000, condition:100, status:"inspect", price:0, views:0, interested:[] });
    s.threads.push({ id:"salon-thread", customer:s.people[0].id, item:"salon-item", offer:12000, expires:s.now+60000, status:"open", messages:[{at:s.now,from:s.people[0].name,text:"Czy oferta jest aktualna?"}] });
    s.orders.push({id:"salon-order",item:"salon-item",customer:s.people[0].id,total:12000,status:"packing",packed:false,due:s.now+60000,returnUntil:s.now+120000,quality:100,refund:0});
    let a=salonActivity(s);
    expect(a.auctions.text).toBe("Kończy się za 28 s");
    for(const id of ["inventory","shop","messages","deliveries"] as const) expect(a[id].count).toBe(1);
    s.threads[0].readAt=s.now; s.items[0].status="stock"; s.orders[0].status="shipping"; s.now+=30000;
    a=salonActivity(s);expect(Object.values(a).every(x=>!x.active)).toBe(true);
    s.threads[0].readAt=0; s.threads[0].expires=s.now-1;
    expect(salonActivity(s).shop.count).toBe(0);
    s.auctions[0].end=s.now+10000;s.auctions[0].status="closed";
    expect(salonActivity(s).auctions.active).toBe(false);
  });
});
