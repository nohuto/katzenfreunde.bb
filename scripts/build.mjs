import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild, transform } from "esbuild";
import { parse, serialize } from "parse5";
import sharp from "sharp";
import { minifyHtml } from "./minify-html.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.join(root, "site");
const pagesDir = path.join(site, "pages");
const partialsDir = path.join(site, "partials");
const publicDir = path.join(site, "public");
const distDir = path.join(root, "dist");

const rasterPattern = /\.(?:jpe?g|png|webp)$/i;
const rootPages = new Set(["index.html", "404.html"]);
const pageToNav = new Map([
  ["home", "home"],
  ["termine", "termine"],
  ["unsere-aktivitaeten", "aktivitaeten"],
  ["flohmaerkte", "aktivitaeten"],
  ["tieraerztl-versorgung", "aktivitaeten"],
  ["futterstellen", "aktivitaeten"],
  ["katzenvermittlung", "aktivitaeten"],
  ["schutzgebuehren", "aktivitaeten"],
  ["endlich-daheim", "aktivitaeten"],
  ["futter-shop", "aktivitaeten"],
  ["vermittlung", "vermittlung"],
  ["berichte", "berichte"],
  ["mitglied-werden", "mitgliedschaft"],
  ["spenden", "spenden"],
  ["tipps", "tipps"],
  ["kontakt", "kontakt"]
]);

const toPosix = value => value.split(path.sep).join("/");
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;

function setAttr(node, name, value) {
  node.attrs ||= [];
  const existing = node.attrs.find(item => item.name === name);
  if (existing) existing.value = value;
  else node.attrs.push({ name, value });
}

function removeAttr(node, name) {
  if (node.attrs) node.attrs = node.attrs.filter(item => item.name !== name);
}

function addClass(node, className) {
  const classes = new Set((attr(node, "class") || "").split(/\s+/).filter(Boolean));
  classes.add(className);
  setAttr(node, "class", [...classes].join(" "));
}

function walk(node, visit, parent = null) {
  visit(node, parent);
  for (const child of node.childNodes || []) walk(child, visit, node);
  if (node.content) walk(node.content, visit, node);
}

async function loadPartials() {
  const entries = await readdir(partialsDir, { withFileTypes: true });
  return new Map(await Promise.all(entries
    .filter(entry => entry.isFile() && entry.name.endsWith(".html"))
    .map(async entry => [entry.name.slice(0, -5), await readFile(path.join(partialsDir, entry.name), "utf8")])));
}

function expandIncludes(source, partials) {
  let result = source;
  for (let pass = 0; pass < 10; pass += 1) {
    let changed = false;
    result = result.replace(/<!--\s*include:([a-z0-9-]+)\s*-->/gi, (_, name) => {
      const partial = partials.get(name);
      if (partial === undefined) throw new Error(`Unknown partial: ${name}`);
      changed = true;
      return partial;
    });
    if (!changed) return result;
  }
  throw new Error("Partial expansion exceeded 10 passes");
}

async function collectExpandedPages(partials) {
  const entries = (await readdir(pagesDir, { withFileTypes: true }))
    .filter(entry => entry.isFile() && entry.name.endsWith(".html"));
  return Promise.all(entries.map(async entry => ({
    name: entry.name,
    source: expandIncludes(await readFile(path.join(pagesDir, entry.name), "utf8"), partials)
  })));
}

function collectRasterUrls(pages) {
  const urls = new Set();
  const pattern = /\/assets\/[A-Za-z0-9_./-]+\.(?:jpe?g|png|webp)/gi;
  for (const page of pages) {
    for (const match of page.source.matchAll(pattern)) urls.add(match[0]);
  }
  return [...urls].sort();
}

const written = new Set();

function track(file) {
  written.add(path.resolve(file));
  return file;
}

async function ensureParent(file) {
  await mkdir(path.dirname(file), { recursive: true });
}

async function writeOutput(file, data) {
  await ensureParent(file);
  await writeFile(file, data);
  track(file);
}

async function generateImages(urls) {
  const result = new Map();
  const generatedByHash = new Map();

  for (const url of urls) {
    const sourceFile = path.join(publicDir, url.slice(1));
    const input = await readFile(sourceFile);
    const hash = createHash("sha256").update(input).digest("hex");

    if (url === "/assets/katzenfreunde-circle.png") {
      const outputFile = path.join(distDir, url.slice(1));
      await ensureParent(outputFile);
      await sharp(input).png({ compressionLevel: 9, palette: true }).toFile(track(outputFile));
      result.set(url, { src: url, srcset: "", width: 200, height: 200 });
      continue;
    }

    if (generatedByHash.has(hash)) {
      result.set(url, generatedByHash.get(hash));
      continue;
    }

    const image = sharp(input, { failOn: "warning" }).rotate();
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) throw new Error(`Missing image dimensions: ${url}`);

    const oriented = metadata.orientation && metadata.orientation >= 5
      ? { width: metadata.height, height: metadata.width }
      : { width: metadata.width, height: metadata.height };
    const candidates = [480, 800, 1200, 1600].filter(width => width < oriented.width);
    const widths = [...new Set([...candidates, oriented.width])];
    const parsed = path.posix.parse(url);
    const variants = [];

    for (const width of widths) {
      const suffix = width === oriented.width ? "" : `-${width}`;
      const outputUrl = `${parsed.dir}/${parsed.name}${suffix}.webp`;
      const outputFile = path.join(distDir, outputUrl.slice(1));
      await ensureParent(outputFile);
      await sharp(input, { failOn: "warning" })
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82, effort: 5, smartSubsample: true })
        .toFile(track(outputFile));
      variants.push({ url: outputUrl, width });
    }

    const generated = {
      src: variants.at(-1).url,
      srcset: variants.length > 1
        ? variants.map(variant => `${variant.url} ${variant.width}w`).join(", ")
        : "",
      width: oriented.width,
      height: oriented.height
    };
    generatedByHash.set(hash, generated);
    result.set(url, generated);
  }

  return result;
}

function transformPage(source, outputPath, images) {
  const document = parse(source);
  let body = null;
  walk(document, node => {
    if (node.tagName === "body") body = node;
  });
  const page = body ? attr(body, "data-page") : "";
  const activeNav = pageToNav.get(page);

  walk(document, (node, parent) => {
    const navKey = attr(node, "data-nav-key");
    if (navKey) {
      if (navKey === activeNav && parent?.tagName === "li") {
        addClass(parent, "is-active");
        setAttr(node, "aria-current", "page");
      }
      removeAttr(node, "data-nav-key");
    }

    if (node.tagName === "a" && attr(node, "href") === outputPath && parent?.tagName === "li") {
      addClass(parent, "is-active");
      setAttr(node, "aria-current", "page");
    }

    if (node.tagName === "img") {
      const sourceUrl = attr(node, "src");
      const generated = images.get(sourceUrl);
      if (!generated) return;
      setAttr(node, "src", generated.src);
      if (generated.srcset) {
        setAttr(node, "srcset", generated.srcset);
        if (!attr(node, "sizes")) setAttr(node, "sizes", "(max-width: 700px) 100vw, (max-width: 1100px) 80vw, 960px");
      }
      if (!attr(node, "width")) setAttr(node, "width", String(generated.width));
      if (!attr(node, "height")) setAttr(node, "height", String(generated.height));
    }

    if (node.tagName === "a") {
      const sourceUrl = attr(node, "href");
      const generated = images.get(sourceUrl);
      if (generated) setAttr(node, "href", generated.src);
    }

    if (node.tagName === "link" && attr(node, "rel") === "preload" && attr(node, "as") === "image") {
      const sourceUrl = attr(node, "href");
      const generated = images.get(sourceUrl);
      if (!generated) return;
      setAttr(node, "href", generated.src);
      setAttr(node, "type", "image/webp");
      if (generated.srcset) setAttr(node, "imagesrcset", generated.srcset);
    }
  });

  return serialize(document);
}

async function copyStaticAssets(source, destination) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyStaticAssets(from, to);
      continue;
    }
    if (rasterPattern.test(entry.name)) continue;
    await ensureParent(to);
    await cp(from, to);
    track(to);
  }
}

async function buildStyles() {
  const entries = ["fonts.css", "base.css", "layout.css", "content.css", "components.css", "pages.css"];
  const css = (await Promise.all(entries.map(file => readFile(path.join(publicDir, "styles", file), "utf8")))).join("\n");
  const { code } = await transform(css, { loader: "css", minify: true, legalComments: "none", target: "es2020" });
  await writeOutput(path.join(distDir, "styles", "site.min.css"), code);
}

async function buildScripts() {
  await Promise.all(["site", "404"].map(name => esbuild({
    entryPoints: [path.join(publicDir, "scripts", `${name}.js`)],
    outfile: track(path.join(distDir, "scripts", `${name}.min.js`)),
    bundle: true,
    minify: true,
    format: "iife",
    target: "es2020",
    legalComments: "none"
  })));
}

async function exists(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

async function validateOutput() {
  const errors = [];
  const pages = [
    path.join(distDir, "index.html"),
    path.join(distDir, "404.html"),
    ...(await readdir(path.join(distDir, "pages"))).filter(name => name.endsWith(".html")).map(name => path.join(distDir, "pages", name))
  ];
  const localPattern = /(?:href|src)="(\/[^"#?]+)(?:[?#][^"]*)?"/g;

  for (const page of pages) {
    const source = await readFile(page, "utf8");
    for (const match of source.matchAll(localPattern)) {
      const url = match[1];
      const target = url === "/" ? path.join(distDir, "index.html") : path.join(distDir, url.slice(1));
      if (!(await exists(target))) errors.push(`${toPosix(path.relative(distDir, page))}: ${url}`);
    }
  }
  if (errors.length) throw new Error(`Broken local URLs:\n${errors.join("\n")}`);
}

async function pruneStale(directory) {
  let kept = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (await pruneStale(file)) kept += 1;
      else await rm(file, { recursive: true, force: true });
      continue;
    }
    if (written.has(path.resolve(file))) kept += 1;
    else await rm(file, { force: true });
  }
  return kept > 0;
}

async function directorySize(directory) {
  let total = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    total += entry.isDirectory() ? await directorySize(file) : (await stat(file)).size;
  }
  return total;
}

async function main() {
  await mkdir(distDir, { recursive: true });

  const partials = await loadPartials();
  const pages = await collectExpandedPages(partials);
  const images = await generateImages(collectRasterUrls(pages));

  await copyStaticAssets(path.join(publicDir, "assets"), path.join(distDir, "assets"));
  await mkdir(path.join(distDir, "styles", "fonts"), { recursive: true });
  for (const font of (await readdir(path.join(publicDir, "styles", "fonts"))).filter(file => file.endsWith(".woff2"))) {
    const target = path.join(distDir, "styles", "fonts", font);
    await cp(path.join(publicDir, "styles", "fonts", font), target);
    track(target);
  }
  await Promise.all([buildStyles(), buildScripts()]);
  await cp(path.join(publicDir, ".htaccess"), track(path.join(distDir, ".htaccess")));

  for (const page of pages) {
    const outputPath = rootPages.has(page.name) ? `/${page.name}` : `/pages/${page.name}`;
    const outputFile = path.join(distDir, outputPath.slice(1));
    const transformed = transformPage(page.source, outputPath, images);
    await writeOutput(outputFile, `${minifyHtml(transformed)}\n`);
  }

  await pruneStale(distDir);
  await validateOutput();
  const bytes = await directorySize(distDir);
  console.log(`Built ${pages.length} pages in dist (${(bytes / 1024 / 1024).toFixed(2)} MB).`);
}

await main();
