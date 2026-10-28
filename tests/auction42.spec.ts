import { test, expect } from "@playwright/test";
import { createGame, bid } from "../src/engine";
async function enter(page:any) {
  const s=createGame(Date.now(),42), a=s.auctions[0];
  s.auctions=s.auctions.slice(0,2);
  Object.assign(a,{product:"blue",price:17000,end:s.now+120000,limits:{p0:18000},leader:null,bids:[]});
  bid(s,a.id,"p0",18000);s.events=[];
  await page.goto("./");await page.getByRole("button",{name:"Importuj zapis",exact:true}).click();
  await page.locator("input[type=file]").setInputFiles({name:"auction42.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(s))});
  await page.getByRole("button",{name:"Aukcje",exact:true}).click();
  await page.getByRole("button",{name:"Wejdź do licytacji",exact:true}).first().click();
  return page.getByRole("dialog",{name:`Aukcja ${a.id}`,exact:true});
}
for(const [width,height] of [[1440,900],[768,1024],[390,844]]) test(`sala 4.2 ${width}: prawdziwy rywal, fotografia, oferta i nawigacja`,async({page})=>{
  await page.setViewportSize({width,height});const room=await enter(page);
  await expect(room.locator(".rival-leading")).toContainText("Collector1978");
  await expect.poll(()=>room.locator(".photo-stage img").first().evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
  await expect(room.locator(".room-price")).toContainText("180,00");
  await room.evaluate((el: HTMLElement) => { el.scrollTop = 0; });
  await page.screenshot({path:`test-results/auction42-${width}.png`,animations:"disabled"});
  if(width<=700) { await expect(room.locator(".auction-rivals")).not.toHaveAttribute("open",""); await room.locator(".auction-rivals > summary").click(); }
  await room.getByLabel("Twoja oferta (€)").fill("200");await room.getByRole("button",{name:"LICYTUJ",exact:true}).click();
  await expect(room.locator(".room-pulse")).toContainText("PROWADZISZ");
  await expect(room.locator(".room-price")).toContainText("200,00");
  expect(await room.evaluate((el:HTMLElement)=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  await room.screenshot({path:`test-results/auction42-bidding-${width}.png`,animations:"disabled"});
  const oldLabel=await room.getAttribute("aria-label");
  await room.getByRole("button",{name:"Następna",exact:true}).click();
  await expect(page.getByRole("dialog")).not.toHaveAttribute("aria-label",oldLabel!);
  await page.getByRole("dialog").getByRole("button",{name:"Poprzednia",exact:true}).click();
  await expect(page.getByRole("dialog").locator(".room-price")).toContainText("200,00");
});
test("jeden przełącznik dźwięku: domyślnie wyłączony, zapamiętany po odświeżeniu",async({page})=>{
  const room=await enter(page);const toggle=room.getByRole("switch",{name:"Dźwięki gry"});
  await expect(toggle).toHaveAttribute("aria-checked","false");await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked","true");
  expect(await page.evaluate(()=>localStorage.getItem("jw-sound"))).toBe("true");
  await room.getByRole("button",{name:"Zamknij okno"}).click();await page.reload();
  await page.getByRole("button",{name:"USTAWIENIA",exact:true}).click();
  await expect(page.getByRole("switch",{name:"Dźwięki gry"})).toHaveAttribute("aria-checked","true");
  await page.getByRole("switch",{name:"Dźwięki gry"}).click();
  expect(await page.evaluate(()=>localStorage.getItem("jw-sound"))).toBe("false");
});
