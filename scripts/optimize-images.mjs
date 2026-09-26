import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse, serialize } from 'parse5';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const sourceDir = path.join(root, 'src', 'image-sources');
const outputDir = path.join(root, 'dist');
const pagesDir = path.join(outputDir, 'pages');
const imagePattern = /\/assets\/[\w./-]+\.(?:jpe?g|png|webp)/gi;

const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
function setAttr(node, name, value) {
  const item = node.attrs.find(entry => entry.name === name);
  if (item) item.value = value;
  else node.attrs.push({ name, value });
}
function walk(node, visit) {
  visit(node);
  for (const child of node.childNodes || []) walk(child, visit);
}

async function variants(url) {
  const input = await readFile(path.join(sourceDir, url));
  const meta = await sharp(input).metadata();
  if (url === '/assets/katzenfreunde-circle.png') {
    const output = path.join(outputDir, url);
    await mkdir(path.dirname(output), { recursive: true });
    await sharp(input).png({ compressionLevel: 9, palette: true }).toFile(output);
    return { src: url, width: 200, height: 200 };
  }

  const [width, height] = meta.orientation >= 5
    ? [meta.height, meta.width] : [meta.width, meta.height];
  const widths = [...[480, 800, 1200, 1600].filter(value => value < width), width];
  const stem = url.replace(/\.\w+$/, '');
  const outputs = await Promise.all(widths.map(async value => {
    const outputUrl = `${stem}${value === width ? '' : `-${value}`}.webp`;
    const output = path.join(outputDir, outputUrl);
    await mkdir(path.dirname(output), { recursive: true });
    await sharp(input).rotate().resize({ width: value })
      .webp({ quality: 82, effort: 5, smartSubsample: true }).toFile(output);
    return { url: outputUrl, width: value };
  }));
  return {
    src: outputs.at(-1).url,
    srcset: outputs.length > 1 ? outputs.map(item => `${item.url} ${item.width}w`).join(', ') : '',
    width,
    height,
  };
}

const files = [
  path.join(outputDir, 'index.html'), path.join(outputDir, '404.html'),
  ...(await readdir(pagesDir)).filter(name => name.endsWith('.html')).map(name => path.join(pagesDir, name)),
];
const pages = await Promise.all(files.map(async file => ({ file, html: await readFile(file, 'utf8') })));
const urls = new Set(pages.flatMap(({ html }) => html.match(imagePattern) || []));
const images = new Map(await Promise.all([...urls].map(async url => [url, await variants(url)])));

for (const { file, html } of pages) {
  const document = parse(html);
  walk(document, node => {
    const key = node.tagName === 'img' ? 'src' : 'href';
    const image = images.get(attr(node, key));
    if (!image) return;
    if (node.tagName === 'img') {
      setAttr(node, 'src', image.src);
      if (image.srcset) {
        setAttr(node, 'srcset', image.srcset);
        if (!attr(node, 'sizes')) setAttr(node, 'sizes', '(max-width: 700px) 100vw, (max-width: 1100px) 80vw, 960px');
      }
      if (!attr(node, 'width')) setAttr(node, 'width', String(image.width));
      if (!attr(node, 'height')) setAttr(node, 'height', String(image.height));
    } else if (node.tagName === 'a') {
      setAttr(node, 'href', image.src);
    } else if (node.tagName === 'link' && attr(node, 'rel') === 'preload') {
      setAttr(node, 'href', image.src);
      setAttr(node, 'type', 'image/webp');
      if (image.srcset) setAttr(node, 'imagesrcset', image.srcset);
    }
  });
  await writeFile(file, serialize(document));
}
