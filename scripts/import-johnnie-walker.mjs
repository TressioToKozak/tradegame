import { readFile, writeFile, mkdir, realpath, stat } from "node:fs/promises";
import { resolve, relative, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const json = async (path, fallback) => {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT" && fallback !== undefined)
      return structuredClone(fallback);
    throw e;
  }
};
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const normalize = (s) =>
  String(s ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/johnnie walker/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const validNumber = (n) => typeof n === "number" && Number.isFinite(n) && n > 0;
const sameSpecs = (a, b) =>
  !(
    (a.volumeMl && b.volume && a.volumeMl !== b.volume) ||
    (a.abv && b.abv && a.abv !== b.abv) ||
    (a.ageStatement && b.age && a.ageStatement !== b.age)
  );
const signature = (w) =>
  [
    w.brand,
    normalize(w.name),
    w.volume ?? "?",
    w.abv ?? "?",
    w.age ?? "?",
    w.series ?? "",
    w.edition ?? "",
    w.releaseYear ?? "",
    w.packaging ?? "",
  ].join("|");
export function buildMarket(record, quote, evidence, previous, override = {}) {
  const observations = evidence?.observations ?? [];
  const matching = observations.filter(
    (o) =>
      validNumber(record.volume) &&
      validNumber(record.abv) &&
      o.confirmedVolumeMl === record.volume &&
      o.confirmedAbv === record.abv &&
      validNumber(o.priceGBP) &&
      o.source &&
      o.sourceSha256,
  );
  const priced = quote && quote.currency === "EUR" && validNumber(quote.amount);
  const retail =
    priced &&
    quote.kind === "retail" &&
    !quote.referenceOnly &&
    quote.volumeMl === record.volume;
  const sold =
    priced &&
    quote.kind === "auction-result" &&
    !quote.referenceOnly &&
    matching.length > 0 &&
    validNumber(quote.exchangeRate);
  const ranged = sold && matching.length >= 2;
  const reference =
    retail || sold
      ? Math.round(quote.amount * 100)
      : (previous?.referenceRetailCents ??
        (priced
          ? Math.max(
              500,
              Math.round(quote.amount * 100 * (quote.referenceOnly ? 0.7 : 1)),
            )
          : 5000));
  const auctionPrices = ranged
    ? matching.map((o) => Math.round(o.priceGBP * quote.exchangeRate * 100))
    : [];
  const available =
    quote?.market === "NL" && retail
      ? record.category === "Klasyka"
        ? "common"
        : "moderate"
      : sold
        ? matching.length >= 3
          ? "limited"
          : "scarce"
        : "limited";
  const reasons = [];
  if (!retail && !sold)
    reasons.push(
      quote?.referenceOnly
        ? "Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych"
        : "Cena bez zgodnego dowodu sprzedaży lub oferty",
    );
  if (sold && matching.length === 1)
    reasons.push(
      "Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem",
    );
  if (sold && quote.soldAt && quote.soldAt < "2025-10")
    reasons.push("Wynik starszy niż rok względem aktualizacji źródła");
  if (retail && quote.market !== "NL")
    reasons.push(
      "Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia",
    );
  return {
    referenceRetailCents: reference,
    retailCents: retail ? Math.round(quote.amount * 100) : null,
    observedAuctionCents: sold ? Math.round(quote.amount * 100) : null,
    auctionMinCents: ranged ? Math.min(...auctionPrices) : null,
    auctionMaxCents: ranged ? Math.max(...auctionPrices) : null,
    availability: available,
    rarity: 5,
    demand: 55,
    liquidity: 45,
    productionStatus: "unknown",
    regions: retail && quote.market === "NL" ? ["NL", "EU"] : ["Global"],
    ...Object.fromEntries(
      Object.entries(override).filter(([k]) =>
        [
          "availability",
          "rarity",
          "demand",
          "liquidity",
          "productionStatus",
          "regions",
          "boxPremiumRate",
        ].includes(k),
      ),
    ),
    availabilityNL:
      retail && quote.market === "NL" ? "retail-listed" : "unknown",
    availabilityEU:
      retail && quote.market === "NL" ? "retail-listed" : "unknown",
    availabilityEstimated: true,
    boxPremiumRate: override.boxPremiumRate ?? 0.12,
    boxPremiumEstimated: true,
    lastVerified: retail || sold ? quote.checkedAt : null,
    sources: priced
      ? [quote.sourceUrl, ...matching.map((o) => o.source)].filter(
          (v, i, a) => v && a.indexOf(v) === i,
        )
      : [],
    referenceKind: retail
      ? "sourced-retail"
      : sold
        ? "sourced-auction"
        : "game-balance",
    verificationScope: "source-repository",
    lastReviewed: quote?.checkedAt ?? "unknown",
    pricingNeedsReview: reasons.length > 0,
    pricingReviewReasons: reasons,
    sampleCount: sold ? matching.length : 0,
    sourceQuote: quote ?? null,
    estimateNote: retail
      ? "Oferta sklepowa z repozytorium źródłowego; nie jest ceną zakończonej sprzedaży."
      : sold
        ? "Zgodne wyniki aukcyjne ze źródła; cena młotkowa bez opłat."
        : "Ostrożny parametr symulacji; cena tego wariantu pozostaje niezweryfikowana.",
  };
}
function category(record, previous) {
  if (previous) return previous.category;
  if (record.category === "Kolekcjonerska") return "vintage";
  if (
    record.salesMarket === "Travel Retail" ||
    /explorers|travel retail/i.test(record.name)
  )
    return "travel";
  if (record.series === "Blue Label" || /blue label/i.test(record.name))
    return "blue";
  return "standard";
}
export async function importJohnnieWalker({
  sourceRoot = resolve(root, "../whisky"),
  targetRoot = root,
  includeWalkerSons = false,
  dryRun = false,
} = {}) {
  sourceRoot = await realpath(sourceRoot);
  targetRoot = await realpath(targetRoot);
  const source = await json(resolve(sourceRoot, "src/catalog.json"));
  if (!Array.isArray(source)) throw Error("Źródłowy katalog musi być tablicą.");
  const allowed = includeWalkerSons
    ? ["Johnnie Walker", "John Walker & Sons"]
    : ["Johnnie Walker"];
  const selected = source.filter((w) => allowed.includes(w.brand));
  if (!selected.length)
    throw Error("Brak rekordów wybranej marki — niczego nie zmieniono.");
  const prices = await json(resolve(sourceRoot, "src/prices.json"), {}),
    evidence = await json(resolve(sourceRoot, "data/price-evidence.json"), {}),
    texts = await json(resolve(sourceRoot, "src/product-text.json"), {});
  const catalog = await json(resolve(targetRoot, "src/catalog-data.json"));
  const manifest = await json(resolve(targetRoot, "src/product-media.json"));
  const overrides = await json(
      resolve(targetRoot, "data/johnnie-walker/mapping-overrides.json"),
      {},
    ),
    markets = await json(
      resolve(targetRoot, "data/johnnie-walker/market-overrides.json"),
      {},
    );
  const oldMap = await json(
    resolve(targetRoot, "data/johnnie-walker/id-map.json"),
    { entries: {} },
  );
  const ids = new Set(),
    signatures = new Set(),
    duplicates = [];
  for (const w of selected) {
    if (ids.has(w.id) || signatures.has(signature(w))) duplicates.push(w.id);
    ids.add(w.id);
    signatures.add(signature(w));
  }
  if (duplicates.length)
    throw Error("Duplikaty w źródle: " + duplicates.join(", "));
  const mediaRoot = await realpath(resolve(sourceRoot, "public/bottles"));
  const plans = [],
    missing = [],
    used = new Set();
  let added = 0,
    updated = 0;
  for (const w of selected) {
    if (
      typeof w.id !== "string" ||
      !/^jw[-a-z0-9]+$/.test(w.id) ||
      typeof w.name !== "string"
    )
      throw Error("Nieprawidłowy identyfikator lub nazwa produktu.");
    let gameId =
      oldMap.entries[w.id]?.gameId ??
      overrides[w.id] ??
      catalog.find((v) => v.importSource?.id === w.id)?.id;
    if (!gameId) {
      const matches = catalog.filter(
        (v) =>
          !v.importSource &&
          normalize(v.name) === normalize(w.name) &&
          sameSpecs(v, w),
      );
      if (matches.length > 1)
        throw Error(
          `Niejednoznaczne dopasowanie ${w.id}. Dodaj jawne mapowanie.`,
        );
      gameId = matches[0]?.id ?? w.id;
    }
    if (used.has(gameId))
      throw Error(`Dwie edycje wskazują na ${gameId}; nie łączymy wariantów.`);
    used.add(gameId);
    const previous = catalog.find((v) => v.id === gameId);
    if (previous && !sameSpecs(previous, w))
      throw Error(
        `Niezgodne parametry ${w.id} → ${gameId}. Warianty wymagają osobnych ID.`,
      );
    if (previous?.importSource && previous.importSource.id !== w.id)
      throw Error(`Kolizja ID: ${gameId}`);
    const imageEntries = [w.image, ...(w.images ?? [])]
      .filter(Boolean)
      .map((v) => (typeof v === "string" ? { path: v } : v));
    const images = [];
    for (const im of imageEntries) {
      if (
        typeof im.path !== "string" ||
        !/^\/bottles\/[^/]+\.(webp|jpe?g|png)$/i.test(im.path)
      )
        throw Error(`Niedozwolona ścieżka obrazu: ${im.path}`);
      const path = resolve(sourceRoot, "public", "." + im.path);
      try {
        const actual = await realpath(path);
        if (
          relative(mediaRoot, actual).startsWith("..") ||
          !(await stat(actual)).isFile()
        )
          throw Error("Poza katalogiem butelek");
        const bytes = await readFile(actual);
        const meta = await sharp(bytes, {
          limitInputPixels: 40000000,
        }).metadata();
        if (!["jpeg", "png", "webp"].includes(meta.format))
          throw Error("Niewłaściwy format obrazu");
        const hash = digest(bytes);
        const dest = `images/whisky/imported/${w.id}${images.length ? "-" + images.length : ""}.webp`;
        if (!images.some((i) => i.hash === hash))
          images.push({
            path: actual,
            hash,
            dest,
            bytes,
            label: im.label ?? "Fotografia wydania",
            kind: im.kind === "box" ? "box" : "bottle",
            sourcePath: im.path,
          });
      } catch (e) {
        missing.push({ id: w.id, path: im.path, error: e.message });
      }
    }
    if (!imageEntries.length)
      missing.push({
        id: w.id,
        path: null,
        error: "Brak ścieżki image w katalogu źródłowym",
      });
    plans.push({ record: w, gameId, previous, images });
    if (previous) updated++;
    else added++;
  }
  const stats = {
    sourceRecords: source.length,
    brands: allowed,
    selectedRecords: selected.length,
    uniqueProducts: selected.length,
    added,
    updated,
    images: plans.reduce((n, p) => n + p.images.length, 0),
    missingFiles: missing,
  };
  if (dryRun) return stats;
  if (missing.length)
    throw Error(
      "Nie zaimportowano danych: brakujące/uszkodzone pliki: " +
        JSON.stringify(missing),
    );
  let commit = "unknown";
  try {
    commit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {}
  const baselineLegacyIds =
    oldMap.legacyIds ??
    (await json(
      resolve(targetRoot, "data/johnnie-walker/legacy-ids.json"),
      catalog.filter((w) => !w.importSource).map((w) => w.id),
    ));
  const map = {
    legacyIds: baselineLegacyIds,
    sourceRepository: "TressioToKozak/whisky",
    sourceCommit: commit,
    brands: allowed,
    entries: { ...oldMap.entries },
  };
  const imageOutputs = [];
  for (const plan of plans) {
    const { record: w, gameId, previous, images } = plan;
    const q = prices[w.id];
    const mapped = {
      ...previous,
      id: gameId,
      brand: w.brand,
      name: `${w.brand} ${w.name}`,
      series: w.series ?? null,
      sourceCategory: w.category,
      category: category(w, previous),
      description:
        texts[w.id]?.pl || w.description || "Brak opisu w katalogu źródłowym.",
      volumeMl: w.volume ?? null,
      abv: w.abv ?? null,
      ageStatement: w.age ?? null,
      ageStatus: w.ageStatus ?? "unknown",
      country: w.country ?? null,
      productionRegion: w.region ?? null,
      salesMarket: w.salesMarket ?? null,
      tags: w.tags ?? [],
      whiskyType: w.whiskyType ?? "unknown",
      sourceUrl: w.source ?? null,
      market: buildMarket(
        w,
        q,
        evidence[w.id],
        previous?.market,
        markets[gameId],
      ),
      importSource: {
        repository: "TressioToKozak/whisky",
        id: w.id,
        commit,
        image: w.image,
        originalName: w.name,
      },
    };
    // A bottling year is copied only from an explicit source field, never inferred from age or label.
    if (w.releaseYear !== undefined) mapped.releaseYear = w.releaseYear;
    if (w.edition !== undefined) mapped.edition = w.edition;
    mapped.balanceNote = mapped.market.estimateNote;
    const idx = catalog.findIndex((v) => v.id === gameId);
    if (idx < 0) catalog.push(mapped);
    else catalog[idx] = mapped;
    const photos = [];
    for (const im of images) {
      const dest = resolve(targetRoot, "public", im.dest);
      await mkdir(dirname(dest), { recursive: true });
      const previousPhoto = manifest.products[gameId]?.find(
        (p) => p.path === im.dest && p.sourceSha256 === im.hash,
      );
      let output;
      try {
        const existing = await readFile(dest);
        if (previousPhoto?.outputSha256 === digest(existing)) output = existing;
      } catch {}
      if (!output)
        output = await sharp(im.bytes, { limitInputPixels: 40000000 })
          .rotate()
          .resize({
            width: 1000,
            height: 1200,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 88, effort: 5 })
          .toBuffer();
      await writeFile(dest, output);
      const photo = {
        path: im.dest,
        label: im.label,
        kind: im.kind,
        author: w.imageAuthor ?? "Autor niepodany w katalogu źródłowym",
        source:
          w.source ||
          w.imageSource ||
          `https://github.com/TressioToKozak/whisky/blob/${commit}/public${im.sourcePath}`,
        license: w.imageLicense ?? "Prawa zastrzeżone — fotografia ze źródła",
        licenseUrl:
          w.imageLicenseUrl ??
          w.source ??
          `https://github.com/TressioToKozak/whisky`,
        sourceImageUrl: w.imageSource ?? null,
        sourceRepository: "TressioToKozak/whisky",
        sourceCommit: commit,
        sourcePath: im.sourcePath,
        sourceSha256: im.hash,
        outputSha256: digest(output),
      };
      photos.push(photo);
      imageOutputs.push({
        sourceId: w.id,
        gameId,
        ...photo,
        sourceBytes: im.bytes.length,
        outputBytes: output.length,
      });
    }
    // Imported galleries are authoritative for the exact variant; do not mix an old 700 ml photo into a 1 L edition.
    manifest.products[gameId] = photos;
    map.entries[w.id] = {
      gameId,
      brand: w.brand,
      name: w.name,
      volumeMl: w.volume ?? null,
      abv: w.abv ?? null,
    };
  }
  for (const w of catalog.filter((w) => !w.importSource)) {
    if (!w.brand && w.name.startsWith("Johnnie Walker "))
      w.brand = "Johnnie Walker";
    w.market.pricingNeedsReview = true;
    w.market.pricingReviewReasons ??= [
      "Brak zweryfikowanej wyceny tego wariantu w repozytorium źródłowym",
    ];
  }
  const unresolved = catalog
    .filter((w) => !manifest.products[w.id]?.length)
    .map((w) => ({ id: w.id, name: w.name }));
  const report = {
    ...stats,
    baselineLegacyCount: baselineLegacyIds.length,
    addedSinceBaseline: catalog.filter((w) => !baselineLegacyIds.includes(w.id))
      .length,
    updatedLegacy: plans.filter((p) => baselineLegacyIds.includes(p.gameId))
      .length,
    sourceRepository: "TressioToKozak/whisky",
    sourceCommit: commit,
    totalGameProducts: catalog.length,
    productsWithoutPhotos: unresolved,
    sourceBytes: imageOutputs.reduce((n, p) => n + p.sourceBytes, 0),
    outputBytes: imageOutputs.reduce((n, p) => n + p.outputBytes, 0),
    pricingReview: catalog
      .filter((w) => w.market.pricingNeedsReview)
      .map((w) => ({
        id: w.id,
        name: w.name,
        reasons: w.market.pricingReviewReasons,
      })),
    unmatchedLegacy: catalog
      .filter((w) => !w.importSource)
      .map((w) => ({ id: w.id, name: w.name })),
  };
  const dataDir = resolve(targetRoot, "data/johnnie-walker");
  await mkdir(dataDir, { recursive: true });
  const outputs = [
    ["src/catalog-data.json", catalog],
    ["src/product-media.json", manifest],
    ["data/johnnie-walker/id-map.json", map],
    ["data/johnnie-walker/source-catalog.json", selected],
    [
      "data/johnnie-walker/source-prices.json",
      Object.fromEntries(selected.map((w) => [w.id, prices[w.id] ?? null])),
    ],
    [
      "data/johnnie-walker/source-price-evidence.json",
      Object.fromEntries(selected.map((w) => [w.id, evidence[w.id] ?? null])),
    ],
    ["data/johnnie-walker/image-provenance.json", imageOutputs],
  ];
  for (const [path, value] of outputs)
    await writeFile(
      resolve(targetRoot, path),
      JSON.stringify(value, null, 2) + "\n",
    );
  // Keep the original baseline counts stable for a same-source idempotence check; return current-run counts separately.
  const oldReport = await json(resolve(dataDir, "import-report.json"), null);
  await writeFile(
    resolve(dataDir, "import-report.json"),
    JSON.stringify(
      oldReport?.sourceCommit === commit &&
        JSON.stringify(oldReport.brands) === JSON.stringify(allowed)
        ? { ...report, added: oldReport.added, updated: oldReport.updated }
        : report,
      null,
      2,
    ) + "\n",
  );
  return report;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2),
    opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--source") opts.sourceRoot = resolve(args[++i]);
    else if (args[i] === "--target") opts.targetRoot = resolve(args[++i]);
    else if (args[i] === "--include-walker-sons") opts.includeWalkerSons = true;
    else if (args[i] === "--dry-run") opts.dryRun = true;
    else throw Error("Nieznany argument: " + args[i]);
  }
  try {
    console.log(JSON.stringify(await importJohnnieWalker(opts), null, 2));
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
