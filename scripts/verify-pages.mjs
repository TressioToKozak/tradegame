import { readFile, readdir, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { chromium, expect } from "@playwright/test";
const base = new URL(
  process.argv[2] ??
    process.env.PAGES_URL ??
    "http://127.0.0.1:4180/tradegame/",
);
if (!base.pathname.endsWith("/")) base.pathname += "/";
const localIndex = await readFile("dist/index.html", "utf8");
const entry = localIndex.match(/<script[^>]+src="([^"]+\.js)"/)?.[1];
if (!entry) throw Error("Brak skompilowanego wejścia Vite.");
let html = "",
  lastError;
for (let attempt = 0; attempt < 12; attempt++) {
  try {
    const url = new URL(base);

    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    html = await response.text();
    if (response.ok && html.includes(entry)) break;
    throw Error(
      `Publiczny index nie wskazuje bieżącego buildu (${response.status}).`,
    );
  } catch (e) {
    lastError = e;
  }
  if (attempt === 11) throw lastError;
  await new Promise((r) => setTimeout(r, 3000));
}
const manifest = JSON.parse(await readFile("src/product-media.json", "utf8"));
const photos = [
  ...Object.values(manifest.products).flat(),
  ...manifest.collection,
];
const paths = [
  ...(await readdir("dist/assets")).map((p) => "assets/" + p),
  "sw.js",
  "favicon.svg",
  "brand/jwcs.svg",
  ...new Set(photos.map((p) => p.path)),
];
const digest = (data) => createHash("sha256").update(data).digest("hex");
let next = 0,
  verified = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (next < paths.length) {
      const path = paths[next++],
        response = await fetch(new URL(path, base), {
          signal: AbortSignal.timeout(20000),
        });
      if (!response.ok) throw Error(`HTTP ${response.status}: ${path}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      const local = await readFile(resolve("dist", path));
      if (digest(bytes) !== digest(local))
        throw Error(`Niezgodny SHA-256: ${path}`);
      verified++;
    }
  }),
);
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] }
    : {},
);
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base.href);
  await expect(
    page.getByRole("button", { name: "NOWA GRA", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".menu-photography img")).toBeVisible();
  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/live-menu.png", fullPage: true });
  await page.getByRole("button", { name: "NOWA GRA", exact: true }).click();
  await page.getByRole("button", { name: "ROZPOCZNIJ GRĘ" }).click();
  await page.getByRole("button", { name: "Pomiń wprowadzenie" }).click();
  await expect(page.locator(".live-shortcut")).toContainText("16 aukcji");
  const visible = page.locator(
    ".auctions-section .auction-card .photo-stage img",
  );
  await expect(visible).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const img = visible.nth(i);
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((i) => i.complete && i.naturalWidth > 0))
      .toBe(true);
  }
  const decoded = await page.evaluate(
    async (urls) => {
      let next = 0,
        loaded = 0;
      await Promise.all(
        Array.from({ length: 4 }, async () => {
          while (next < urls.length) {
            const img = new Image();
            img.src = urls[next++];
            await img.decode();
            if (!img.naturalWidth || !img.naturalHeight)
              throw Error("Pusty obraz");
            loaded++;
          }
        }),
      );
      return loaded;
    },
    photos.map((p) => new URL(p.path, base).href),
  );
  await page
    .getByRole("button", { name: "Aukcje na żywo", exact: true })
    .click();
  await expect(page.locator(".auction-card")).toHaveCount(16);
  await page.screenshot({
    path: "test-results/live-market.png",
    fullPage: true,
  });
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    `Pages: zgodne SHA-256 ${verified} plików; ${decoded} zdjęć zdekodowanych; menu, 16 aukcji i fotografie w kartach działają.`,
  );
} finally {
  await browser.close();
}
