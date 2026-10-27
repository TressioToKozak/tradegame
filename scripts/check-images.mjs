import { readFile, stat } from "node:fs/promises";
import { resolve, relative } from "node:path";
const root = resolve(new URL("../public/", import.meta.url).pathname);
const manifest = JSON.parse(
  await readFile(new URL("../src/product-media.json", import.meta.url), "utf8"),
);
let count = 0;
const failures = [];
for (const [product, photos] of Object.entries({
  ...manifest.products,
  collection: manifest.collection,
})) {
  for (const photo of photos) {
    count++;
    const path = resolve(root, photo.path.replace(/^\//, ""));
    if (
      relative(root, path).startsWith("..") ||
      !photo.path.startsWith("images/whisky/")
    ) {
      failures.push(`${product}: nieprawidłowa ścieżka`);
      continue;
    }
    for (const field of [
      "label",
      "kind",
      "author",
      "source",
      "license",
      "licenseUrl",
    ])
      if (!photo[field]) failures.push(`${product}: brak ${field}`);
    try {
      if (!(await stat(path)).isFile()) throw Error();
      const bytes = await readFile(path);
      const valid =
        bytes.subarray(0, 3).toString("hex") === "ffd8ff" ||
        bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" ||
        (bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP");
      if (!valid)
        failures.push(`${photo.path}: plik nie jest JPEG, PNG ani WebP`);
    } catch {
      failures.push(`${photo.path}: plik nie istnieje`);
    }
  }
}
if (!count)
  console.warn(
    "BRAK ZDJĘĆ: manifest jest pusty. Nie oznacza to spełnienia wymagania fotografii.",
  );
if (process.argv.includes("--strict"))
  for (const key of ["blue", "george", "swing"])
    if (!manifest.products[key]?.length)
      failures.push(`${key}: brak zdjęcia głównej aukcji`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else console.log(`Zweryfikowano ${count} fotografii i ich metadane.`);
