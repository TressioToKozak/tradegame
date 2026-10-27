// Production-only test server with a real repository prefix. No SPA fallback for missing assets.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
const root = resolve("dist");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".json": "application/json",
};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (!pathname.startsWith("/tradegame/")) {
      res.writeHead(404);
      return res.end("Not found");
    }
    let path = resolve(
      root,
      pathname.slice("/tradegame/".length) || "index.html",
    );
    if (!path.startsWith(root + "/")) {
      res.writeHead(403);
      return res.end();
    }
    if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
    res.setHeader(
      "Content-Type",
      mime[extname(path)] ?? "application/octet-stream",
    );
    res.end(await readFile(path));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(4180, "127.0.0.1");
