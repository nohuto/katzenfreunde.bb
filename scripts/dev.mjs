import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const dist = path.join(import.meta.dirname, "..", "dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".cur": "image/x-icon"
};

createServer(async (request, response) => {
  const file = path.join(dist, decodeURIComponent(new URL(request.url, "http://localhost").pathname));
  const target = file === dist + path.sep ? path.join(dist, "index.html") : file;
  try {
    const body = await readFile(target.startsWith(dist) ? target : dist);
    response.writeHead(200, { "Content-Type": types[path.extname(target)] || "application/octet-stream", "Cache-Control": "no-store" }).end(body);
  } catch {
    response.writeHead(404, { "Content-Type": types[".html"], "Cache-Control": "no-store" }).end(await readFile(path.join(dist, "404.html")));
  }
}).listen(process.argv[2] || 8888, "127.0.0.1");
