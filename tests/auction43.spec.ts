import { test, expect, type Page } from "@playwright/test";
import { createGame, bid } from "../src/engine";
async function market(page: Page) {
  const s=createGame(Date.now(),42),a=s.auctions[0];
  Object.assign(a,{product:"blue",price:17000,end:s.now+90000,limits:{p0:18000},leader:null,bids:[]});
  bid(s,a.id,"p0",18000);s.events=[];
  await page.goto("./");await page.getByRole("button",{name:"Importuj zapis",exact:true}).click();
  await page.locator("input[type=file]").setInputFiles({name:"auction43.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(s))});
  await page.getByRole("button",{name:"Aukcje",exact:true}).click();
  return a;
}
for(const [width,height] of [[1440,900],[390,844]])test(`4.3 ${width}: prawdziwa scena, działające warstwy i brak referencji`,async({page})=>{
  await page.setViewportSize({width,height});
  const requested:string[]=[],failures:string[]=[];
  page.on("request",r=>requested.push(r.url()));page.on("response",r=>{if(r.status()>=400)failures.push(r.url());});
  await market(page);
  await expect(page.getByRole("heading",{name:"Rynek aukcyjny",exact:true})).toBeVisible();
  await expect(page.getByRole("region",{name:"Wyróżnione aukcje"})).toBeVisible();
  if(width===1440)await page.screenshot({path:"test-results/market43-1440.png",fullPage:false,animations:"disabled"});
  await page.getByRole("button",{name:"Wejdź do licytacji",exact:true}).first().click();
  const room=page.locator(".auction-room43"),art=room.locator(".auction-scenery img");
  await expect.poll(()=>art.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth===1672)).toBe(true);
  await expect(room.locator(".room-audience .rival-leading")).toContainText("Collector1978");
  await expect(room.locator(".room-center #bid-amount")).toBeVisible();
  await expect(room.locator(".room-center .proxy-panel")).toContainText("Automatyczna licytacja");
  await expect.poll(()=>room.locator(".photo-stage img").first().evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
  const darkPixels = await room.locator(".photo-stage img").first().evaluate(async (img: HTMLImageElement) => {
    await img.decode();
    const canvas=document.createElement("canvas");canvas.width=30;canvas.height=30;
    const context=canvas.getContext("2d")!;context.drawImage(img,0,0,30,30);
    const colors=context.getImageData(0,0,30,30).data;
    return Array.from({length:900},(_,i)=>colors[i*4]<150&&colors[i*4+1]<150&&colors[i*4+2]<150).filter(Boolean).length;
  });
  expect(darkPixels).toBeGreaterThan(40);
  const css=await room.locator(".auction-scenery").evaluate(el=>getComputedStyle(el,"::before").backgroundImage);
  expect(css).toContain("/tradegame/game-art/auction-room.png");expect(css).not.toContain("/assets/");
  expect(await room.evaluate((el:HTMLElement)=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  await room.evaluate((el:HTMLElement)=>{el.scrollTop=0;});
  await page.screenshot({path:`test-results/auction43-${width}.png`,animations:"disabled"});
  expect(requested.some(url=>url.includes("auction-ui-reference"))).toBe(false);
  expect(failures).toEqual([]);
});
test("4.3: sala i prawdziwe zdjęcie działają po odświeżeniu offline",async({page,context})=>{
  await market(page);await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.getByRole("button",{name:"Wejdź do licytacji",exact:true}).first().click();
  await expect.poll(()=>page.locator(".auction-scenery img").evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
  await expect.poll(()=>page.locator(".photo-stage img").first().evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
  await expect(page.locator(".save-state")).toContainText("Postęp zapisany");
  await context.setOffline(true);await page.reload();await page.getByRole("button",{name:"KONTYNUUJ GRĘ",exact:true}).click();
  await page.getByRole("button",{name:"Aukcje",exact:true}).click();await page.getByRole("button",{name:"Wejdź do licytacji",exact:true}).first().click();
  await expect.poll(()=>page.locator(".auction-scenery img").evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth===1672)).toBe(true);
  await expect.poll(()=>page.locator(".photo-stage img").first().evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
});
