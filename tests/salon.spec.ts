import { test, expect, type Page } from "@playwright/test";
import { createGame, type State } from "../src/engine";
async function load(page: Page, state: State) {
  await page.goto("./");
  await page.getByRole("button", { name: "Importuj zapis", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({ name: "salon.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(state)) });
  await expect(page.getByRole("region", { name: "Interaktywny salon whisky", exact: true })).toBeVisible();
}
for (const [width, height] of [[1920,1080], [1440,900], [1366,768], [768,1000], [390,844]]) test(`salon ${width}×${height}: obraz, pozycje, klawiatura i pięć przejść`, async ({ page }) => {
  await page.setViewportSize({ width, height });
  const s = createGame(Date.now(), 42);
  s.events = [];
  s.auctions[0].watched = true;
  s.auctions[0].end = s.now + 55000;
  await load(page, s);
  const salon = page.getByRole("region", { name: "Interaktywny salon whisky" });
  await expect(salon.locator(".salon-zone")).toHaveCount(5);
  await expect(salon.locator('[data-zone="auctions"]')).toHaveClass(/salon-zone-active/);
  await expect(salon.locator('[data-zone="auctions"]')).toContainText(/Kończy się za \d+ s/);
  const image = salon.locator(".salon-art");
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 1672)).toBe(true);
  const geometry = await salon.evaluate(el => {
    const img = el.querySelector(".salon-art")!.getBoundingClientRect();
    return [...el.querySelectorAll<HTMLButtonElement>(".salon-zone")].map(button => {
      const r = button.getBoundingClientRect();
      return { id: button.dataset.zone, x: ((button.dataset.zone === "messages" ? r.right : (r.left+r.right)/2)-img.left)/img.width*100, y: ((button.dataset.zone === "auctions" && innerWidth > 700 ? r.bottom + 20 : (r.top+r.bottom)/2)-img.top)/img.height*100, below: r.top >= img.bottom, left: r.left, right: r.right };
    });
  });
  const points: Record<string, number[]> = { auctions: [50,48], inventory:[27,38], shop:[70,30], messages:[98,31], deliveries:[84,63] };
  for (const g of geometry) {
    if(width > 700) { expect(Math.abs(g.x-points[g.id!][0])).toBeLessThan(1); expect(Math.abs(g.y-points[g.id!][1])).toBeLessThan(1); }
    else { expect(g.below).toBe(true); expect(g.left).toBeGreaterThanOrEqual(0); expect(g.right).toBeLessThanOrEqual(width); }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(salon).toHaveCSS("opacity", "1");
  await expect(page.locator(".tab-scene")).toHaveCSS("opacity", "1");
  await page.screenshot({ animations: "disabled", path:`test-results/salon41-${width}.png`, fullPage:true });
  for(const [id,heading] of [["auctions","Aukcje"],["inventory","Magazyn"],["shop","Mój sklep"],["messages","Wiadomości"],["deliveries","Zamówienia"]]) {
    const button = page.locator(`.salon-zone[data-zone="${id}"]`);
    await button.focus(); await expect(button).toBeFocused(); await page.keyboard.press("Enter");
    await expect(page.getByRole("heading",{name:heading,exact:true}).first()).toBeVisible();
    await page.getByRole("button",{name:"Pulpit",exact:true}).click();
  }
  await expect(page.getByRole("heading", {name:"Twój salon whisky",exact:true})).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
  await page.getByRole("button",{name:"W salonie — wydarzenia",exact:true}).click();
  const events=page.getByRole("dialog",{name:"W salonie",exact:true});
  await expect(events.locator(".salon-events > ol > li")).toHaveCount(s.feed.length);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button",{name:"W salonie — wydarzenia",exact:true})).toBeFocused();
  await page.getByRole("button",{name:"Cele dnia",exact:true}).click();
  await expect(page.getByRole("dialog",{name:"Cele dnia",exact:true})).toBeVisible();
  await expect(page.locator(".daily-board")).toBeVisible();
  await page.screenshot({animations:"disabled",path:`test-results/salon41-tasks-${width}.png`});
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region",{name:"Interaktywny salon whisky",exact:true})).toBeVisible();
});
test("salon: rzeczywiste liczniki, odczyt rozmowy i zachowanie po odświeżeniu", async ({ page }) => {
  const s=createGame(Date.now(),42), customer=s.people.find(p=>p.role==="customer")!;
  s.events=[];
  s.items.push({id:"salon-parcel",product:"blue",cost:10000,condition:100,status:"inspect",price:0,views:0,interested:[]}, {id:"salon-sale",product:"blue",cost:10000,condition:100,status:"listed",price:18000,views:1,interested:[customer.id]}, {id:"salon-packed",product:"blue",cost:10000,condition:100,status:"reserved",price:18000,views:1,interested:[]});
  s.threads.push({id:"salon-offer",customer:customer.id,item:"salon-sale",offer:16000,expires:s.now+60000,status:"open",messages:[{at:s.now,from:customer.name,text:"Chętnie kupię tę butelkę za 160 €."}]});
  s.orders.push({id:"salon-order",item:"salon-packed",customer:customer.id,total:18000,status:"packing",packed:false,due:s.now+60000,returnUntil:s.now+120000,quality:100,refund:0});
  await load(page,s);
  for(const id of ["inventory","shop","messages","deliveries"]) await expect(page.locator(`.salon-zone[data-zone="${id}"] .salon-count`)).toHaveText("1");
  await page.locator('.salon-zone[data-zone="messages"]').click();
  await expect(page.locator(".chat-bubble").last()).toContainText("160 €");
  await page.getByRole("button",{name:"Pulpit",exact:true}).click();
  for(const id of ["messages","shop"]) await expect(page.locator(`.salon-zone[data-zone="${id}"] .salon-count`)).toHaveCount(0);
  await expect(page.locator(".save-state")).toContainText("Postęp zapisany");
  await page.reload();await page.getByRole("button",{name:"KONTYNUUJ GRĘ",exact:true}).click();
  await expect(page.locator('.salon-zone[data-zone="messages"] .salon-count')).toHaveCount(0);
  await expect(page.locator('.salon-zone[data-zone="inventory"] .salon-count')).toHaveText("1");
  await expect(page.locator(".header-cash")).toContainText("5000,00");
});
