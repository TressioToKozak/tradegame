import { test, expect, type Page } from "@playwright/test";
import { catalog } from "../src/catalog";
import { createGame, bid } from "../src/engine";
async function enter(page:Page, product="blue") {
  const s=createGame(Date.now(),42),a=s.auctions[0];s.auctions=s.auctions.slice(0,2);
  Object.assign(a,{product,price:17000,end:s.now+180000,limits:{p0:18000},leader:null,bids:[]});bid(s,a.id,"p0",18000);s.events=[];
  await page.goto("./");await page.getByRole("button",{name:"Importuj zapis",exact:true}).click();
  await page.locator("input[type=file]").setInputFiles({name:"screen431.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(s))});
  await page.getByRole("button",{name:"Aukcje",exact:true}).click();await page.getByRole("button",{name:"Wejdź do licytacji",exact:true}).first().click();
  return page.locator(".auction-location");
}
for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[768,1024],[390,844]])test(`4.3.1 ${width}×${height}: pełna lokacja i dostępne działania`,async({page})=>{
  await page.setViewportSize({width,height});const room=await enter(page);
  await room.locator(".photo-stage img").evaluate((img:HTMLImageElement)=>img.decode());
  const rect=await room.boundingBox();expect(rect).toEqual({x:0,y:0,width,height});
  await expect(page.locator(".modal-backdrop")).toHaveCount(0);await expect(room).not.toHaveClass(/modal|auction-room42|auction-room43/);
  const geometry=await room.evaluate(el=>({scroll:el.scrollHeight,client:el.clientHeight,width:el.scrollWidth,clientWidth:el.clientWidth}));
  expect(geometry.width).toBeLessThanOrEqual(geometry.clientWidth+1);
  if(width>1150){
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.client+1);
    for(const locator of [room.locator(".photo-stage img"),room.locator(".room-price>strong"),room.locator(".room-timer"),room.getByLabel("Twoja oferta (€)"),room.getByRole("button",{name:"LICYTUJ",exact:true}),room.getByRole("tab",{name:/Automat/}),room.locator(".room-leader"),room.locator(".auction-rivals"),room.getByRole("button",{name:"Zamknij okno"})]) {
      const r=await locator.boundingBox();expect(r).not.toBeNull();expect(r!.y).toBeGreaterThanOrEqual(0);expect(r!.y+r!.height).toBeLessThanOrEqual(height+1);
    }
    const background=await room.locator(".photo-stage").evaluate(el=>getComputedStyle(el).backgroundColor);expect(Number(background.match(/[\d.]+/g)?.[3] ?? 1)).toBeLessThan(.1);
  }
  const before=await room.locator(".room-price>strong").innerText();
  await room.locator(".quick-bids button").nth(1).click();await expect(room.getByLabel("Twoja oferta (€)")).toHaveValue("200");
  await expect(room.locator(".room-price>strong")).toHaveText(before);await room.locator(".quick-bids button").first().click();
  await room.getByRole("tab",{name:"Szybka oferta"}).focus();await page.keyboard.press("ArrowRight");
  await expect(room.getByLabel("Automatyczna licytacja — maksymalna oferta (€)")).toBeVisible();await page.keyboard.press("ArrowLeft");
  await room.locator(".photo-stage img").evaluate((img: HTMLImageElement)=>img.decode());
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  if(width<=700) await page.screenshot({path:`test-results/location431-actions-${width}.png`,animations:"disabled"});
  await room.evaluate((el:HTMLElement)=>{el.scrollTop=0;});
  await page.screenshot({path:`test-results/location431-${width}.png`,animations:"disabled"});
  await room.getByRole("tab",{name:/Automat/}).click();
  await room.getByLabel("Automatyczna licytacja — maksymalna oferta (€)").fill("250");
  await room.getByRole("button",{name:"Aktywuj",exact:true}).click();
  const confirm=room.getByRole("button",{name:"Potwierdź aktywację"});
  if(width>1150){const r=await confirm.boundingBox();expect(r!.y+r!.height).toBeLessThanOrEqual(height+1);}
  await confirm.click();await expect(room.locator(".proxy-status")).toContainText("Automat aktywny");
  await room.getByRole("tab",{name:"Szybka oferta"}).click();
  await expect(room.getByLabel("Twoja oferta (€)")).toBeVisible();await expect(room.locator(".auction-player-status")).toContainText("Automat aktywny");
  await room.getByRole("tab",{name:/Automat/}).click();await expect(room.locator(".proxy-status")).toContainText("250,00");
  await room.getByLabel("Automatyczna licytacja — maksymalna oferta (€)").fill("260");
  await room.getByRole("button",{name:"Zmień limit",exact:true}).click();
  const change=room.getByRole("button",{name:"Potwierdź zmianę",exact:true});
  if(width>1150){const r=await change.boundingBox();expect(r!.y+r!.height).toBeLessThanOrEqual(height+1);}
  await change.click();await expect(room.locator(".proxy-status")).toContainText("260,00");
  if(width===1440){
    await room.locator(".photo-stage img").evaluate((img: HTMLImageElement)=>img.decode());
    await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
    await page.screenshot({path:"test-results/location431-automatic.png",animations:"disabled"});
  }
  await room.getByRole("button",{name:"Wyłącz",exact:true}).click();await expect(room.locator(".proxy-heading")).toContainText("WYŁĄCZONA");
  await room.getByRole("button",{name:"Informacje o egzemplarzu",exact:true}).click();
  await expect(page.getByRole("dialog",{name:"Informacje o egzemplarzu",exact:true})).toBeVisible();await page.keyboard.press("Escape");
  await expect(room.getByRole("button",{name:"Informacje o egzemplarzu",exact:true})).toBeFocused();
  await room.locator(".photo-stage").click();await expect(page.getByRole("dialog",{name:/Fotografia:/})).toBeVisible();await page.keyboard.press("Escape");
  await expect(room).toBeVisible();await page.keyboard.press("Escape");await expect(room).toHaveCount(0);
});

test("4.3.1: najdłuższa rzeczywista nazwa edycji nie wypycha oferty i automatu",async({page})=>{
  await page.setViewportSize({width:1366,height:768});
  const product=catalog.slice().sort((a,b)=>b.name.length-a.name.length)[0];
  const room=await enter(page,product.id);
  await expect(room.getByRole("heading",{name:product.name,exact:true})).toBeVisible();
  const manual=await room.getByRole("button",{name:"LICYTUJ",exact:true}).boundingBox();expect(manual!.y+manual!.height).toBeLessThanOrEqual(768);
  await room.getByRole("tab",{name:/Automat/}).click();await room.getByLabel("Automatyczna licytacja — maksymalna oferta (€)").fill("250");
  await room.getByRole("button",{name:"Aktywuj",exact:true}).click();
  const confirm=room.getByRole("button",{name:"Potwierdź aktywację"});const rect=await confirm.boundingBox();expect(rect!.y+rect!.height).toBeLessThanOrEqual(768);await confirm.click();
  await room.getByLabel("Automatyczna licytacja — maksymalna oferta (€)").fill("260");await room.getByRole("button",{name:"Zmień limit",exact:true}).click();
  const change=room.getByRole("button",{name:"Potwierdź zmianę",exact:true});const r=await change.boundingBox();expect(r!.y+r!.height).toBeLessThanOrEqual(768);
});
