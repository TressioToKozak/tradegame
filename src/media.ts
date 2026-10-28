import manifest from "./product-media.json" with { type: "json" };

export interface Photo {
  path: string;
  label: string;
  kind: "bottle" | "box" | "collection";
  author: string;
  source: string;
  license: string;
  licenseUrl: string;
  sourceRepository?: string;
  sourceCommit?: string;
  sourcePath?: string;
  sourceSha256?: string;
  outputSha256?: string;
  sourceImageUrl?: string | null;
}
export const productMedia = manifest as {
  products: Record<string, Photo[]>;
  collection: Photo[];
};

/** Public assets are always relative to Vite's deployment base, never to the domain root. */
export function assetUrl(
  path: string,
  base = import.meta.env.BASE_URL,
): string {
  if (/^(https?:)?\/\//i.test(path))
    throw new Error("Fotografie muszą być przechowywane lokalnie.");
  const clean = path.replace(/^\/+/, "");
  if (
    clean.split("/").some((part) => part === "..") ||
    !clean.startsWith("images/whisky/")
  ) {
    throw new Error("Nieprawidłowa ścieżka fotografii.");
  }
  return `${base.endsWith("/") ? base : base + "/"}${clean}`;
}
export const photosFor = (product: string) =>
  productMedia.products[product] ?? [];
