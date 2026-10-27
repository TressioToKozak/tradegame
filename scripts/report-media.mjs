import { readFile, writeFile } from "node:fs/promises";
const catalog = JSON.parse(
  await readFile(new URL("../src/catalog-data.json", import.meta.url), "utf8"),
);
const media = JSON.parse(
  await readFile(new URL("../src/product-media.json", import.meta.url), "utf8"),
);
const missing = catalog.filter((w) => !media.products[w.id]?.length);
const count = catalog.length - missing.length;
let report = `# Fotografie — pokrycie całego katalogu\n\nZdjęcia: **${count}/${catalog.length} produktów**. Brakuje **${missing.length} edycji**. Wszystkie produkty, także bez zdjęć, uczestniczą w losowaniu aukcji.\n\n| ID | Edycja bez fotografii |\n| --- | --- |\n`;
for (const w of missing) report += `| ${w.id} | ${w.name} |\n`;
report +=
  "\nRaport powstaje z `src/catalog-data.json` i `src/product-media.json`. Brak fotografii nie jest ukrywany przez dobór aukcji. Zdjęć z innych edycji nie używa się jako zamienników.\n";
await writeFile(new URL("../MISSING_IMAGES.md", import.meta.url), report);
console.log(
  `Zdjęcia: ${count}/${catalog.length}; brakujące: ${missing.length}. Pełna lista: MISSING_IMAGES.md`,
);
