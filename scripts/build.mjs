import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { build, transform } from "esbuild";
import { parse, serialize } from "parse5";
import sharp from "sharp";

const root = path.join(import.meta.dirname, "..");
const site = path.join(root, "site");
const pub = path.join(site, "public");
const dist = path.join(root, "dist");

const rootPages = new Set(["index.html", "404.html"]);
const pageToNav = {
  home: "home",
  termine: "termine",
  "unsere-aktivitaeten": "aktivitaeten",
  flohmaerkte: "aktivitaeten",
  "tieraerztl-versorgung": "aktivitaeten",
  futterstellen: "aktivitaeten",
  katzenvermittlung: "aktivitaeten",
  schutzgebuehren: "aktivitaeten",
  "endlich-daheim": "aktivitaeten",
  "futter-shop": "aktivitaeten",
  vermittlung: "vermittlung",
  berichte: "berichte",
  "mitglied-werden": "mitgliedschaft",
  spenden: "spenden",
  tipps: "tipps",
  kontakt: "kontakt"
};

const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
const setAttr = (node, name, value) => {
  const existing = node.attrs.find(a => a.name === name);
  if (existing) existing.value = value;
  else node.attrs.push({ name, value });
};
const markActive = (li, a) => {
  const classes = (attr(li, "class") || "").split(" ").filter(Boolean);
  if (!classes.includes("is-active")) setAttr(li, "class", [...classes, "is-active"].join(" "));
  setAttr(a, "aria-current", "page");
};
const walk = (node, visit, parent) => {
  visit(node, parent);
  for (const child of node.childNodes || []) walk(child, visit, node);
};
const write = async (file, data) => {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
};

async function buildImage(url) {
  const input = await readFile(path.join(pub, url));
  const out = path.join(dist, url);
  await mkdir(path.dirname(out), { recursive: true });

  if (url === "/assets/katzenfreunde-circle.png") {
    await sharp(input).png({ compressionLevel: 9, palette: true }).toFile(out);
    return { src: url, width: 200, height: 200 };
  }

  const meta = await sharp(input).metadata();
  const [width, height] = meta.orientation >= 5 ? [meta.height, meta.width] : [meta.width, meta.height];
  const widths = [...[480, 800, 1200, 1600].filter(w => w < width), width];
  const base = url.replace(/\.\w+$/, "");
  const variants = await Promise.all(widths.map(async w => {
    const variant = `${base}${w === width ? "" : `-${w}`}.webp`;
    await sharp(input).rotate().resize({ width: w }).webp({ quality: 82, effort: 5, smartSubsample: true }).toFile(path.join(dist, variant));
    return { url: variant, width: w };
  }));

  return {
    src: variants.at(-1).url,
    srcset: variants.length > 1 ? variants.map(v => `${v.url} ${v.width}w`).join(", ") : "",
    width,
    height
  };
}

function renderPage(source, outputPath, images) {
  const document = parse(source);
  let activeNav;
  walk(document, (node, parent) => {
    if (node.tagName === "body") activeNav = pageToNav[attr(node, "data-page")];

    const navKey = attr(node, "data-nav-key");
    if (navKey) {
      if (navKey === activeNav) markActive(parent, node);
      node.attrs = node.attrs.filter(a => a.name !== "data-nav-key");
    }
    if (node.tagName === "a" && attr(node, "href") === outputPath && parent.tagName === "li") markActive(parent, node);

    const image = images.get(attr(node, node.tagName === "img" ? "src" : "href"));
    if (!image) return;
    if (node.tagName === "img") {
      setAttr(node, "src", image.src);
      if (image.srcset) {
        setAttr(node, "srcset", image.srcset);
        if (!attr(node, "sizes")) setAttr(node, "sizes", "(max-width: 700px) 100vw, (max-width: 1100px) 80vw, 960px");
      }
      if (!attr(node, "width")) setAttr(node, "width", String(image.width));
      if (!attr(node, "height")) setAttr(node, "height", String(image.height));
    } else if (node.tagName === "a") {
      setAttr(node, "href", image.src);
    } else if (node.tagName === "link" && attr(node, "rel") === "preload") {
      setAttr(node, "href", image.src);
      setAttr(node, "type", "image/webp");
      if (image.srcset) setAttr(node, "imagesrcset", image.srcset);
    }
  });
  return serialize(document);
}

await rm(dist, { recursive: true, force: true });

const partials = Object.fromEntries(await Promise.all((await readdir(path.join(site, "partials"))).map(async f =>
  [f.slice(0, -5), await readFile(path.join(site, "partials", f), "utf8")])));
const pages = await Promise.all((await readdir(path.join(site, "pages"))).map(async name => ({
  name,
  source: (await readFile(path.join(site, "pages", name), "utf8")).replace(/<!--\s*include:([\w-]+)\s*-->/g, (_, p) => partials[p])
})));

const imageUrls = new Set(pages.flatMap(p => p.source.match(/\/assets\/[\w./-]+\.(?:jpe?g|png|webp)/gi) || []));
const images = new Map(await Promise.all([...imageUrls].map(async url => [url, await buildImage(url)])));

const styles = ["fonts", "base", "layout", "content", "components", "pages"];
const css = (await Promise.all(styles.map(f => readFile(path.join(pub, "styles", `${f}.css`), "utf8")))).join("\n");

await Promise.all([
  cp(path.join(pub, "assets"), path.join(dist, "assets"), { recursive: true, filter: f => !/\.(?:jpe?g|png|webp)$/i.test(f) }),
  cp(path.join(pub, "styles", "fonts"), path.join(dist, "styles", "fonts"), { recursive: true }),
  cp(path.join(pub, ".htaccess"), path.join(dist, ".htaccess")),
  transform(css, { loader: "css", minify: true, legalComments: "none", target: "es2020" }).then(r => write(path.join(dist, "styles", "site.min.css"), r.code)),
  ...["site", "404"].map(name => build({
    entryPoints: [path.join(pub, "scripts", `${name}.js`)],
    outfile: path.join(dist, "scripts", `${name}.min.js`),
    bundle: true,
    minify: true,
    format: "iife",
    target: "es2020",
    legalComments: "none"
  })),
  ...pages.map(({ name, source }) => {
    const outputPath = rootPages.has(name) ? `/${name}` : `/pages/${name}`;
    return write(path.join(dist, outputPath), renderPage(source, outputPath, images));
  })
]);
