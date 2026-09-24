import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const port = Number.parseInt(process.argv[2] || "8888", 10);
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".cur", "image/x-icon"],
  [".doc", "application/msword"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff2", "font/woff2"]
]);

const insideRoot = target => target === root || target.startsWith(`${root}${path.sep}`);

async function isFile(target) {
  try {
    return (await stat(target)).isFile();
  } catch {
    return false;
  }
}

async function resolveRoute(pathname) {
  const relative = pathname.replace(/^\/+/, "");
  const direct = path.resolve(root, relative);
  if (!insideRoot(direct)) return null;
  if (await isFile(direct)) return direct;
  if (!path.extname(pathname) && await isFile(`${direct}.html`)) return `${direct}.html`;
  if (pathname.endsWith("/") && await isFile(path.join(direct, "index.html"))) return path.join(direct, "index.html");
  return null;
}

const server = createServer(async (request, response) => {
  if (!request.url || !["GET", "HEAD"].includes(request.method || "")) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const file = await resolveRoute(pathname === "/" ? "/index.html" : pathname);
    if (!file) {
      const notFoundPage = path.join(root, "404.html");
      if (await isFile(notFoundPage)) {
        response.writeHead(404, { "Cache-Control": "no-store", "Content-Type": "text/html; charset=utf-8" });
        createReadStream(notFoundPage).pipe(response);
      } else {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      }
      return;
    }
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": mimeTypes.get(path.extname(file).toLowerCase()) || "application/octet-stream"
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(file).pipe(response);
  } catch {
    response.writeHead(400).end("Bad request");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Preview: http://127.0.0.1:${port}`);
});
