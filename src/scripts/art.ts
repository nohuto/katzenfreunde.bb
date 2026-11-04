type Rect = { x: number; y: number; w: number; h: number };
type Print = [number, number, number];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(rand: () => number) {
  const p = new Uint8Array(512);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    [p[i], p[j]] = [p[j]!, p[i]!];
  }
  for (let i = 0; i < 256; i++) p[i + 256] = p[i]!;
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  const grad = (hash: number, x: number, y: number) => {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return (h & 1 ? -u : u) + (h & 2 ? -2 * v : 2 * v) * 0.5;
  };
  return (px: number, py: number) => {
    const X = Math.floor(px);
    const Y = Math.floor(py);
    const x = px - X;
    const y = py - Y;
    const xi = X & 255;
    const yi = Y & 255;
    const u = fade(x);
    const v = fade(y);
    const aa = p[p[xi]! + yi]!;
    const ab = p[p[xi]! + yi + 1]!;
    const ba = p[p[xi + 1]! + yi]!;
    const bb = p[p[xi + 1]! + yi + 1]!;
    return lerp(
      lerp(grad(aa, x, y), grad(ba, x - 1, y), u),
      lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u),
      v,
    );
  };
}

const inside = (rects: Rect[], x: number, y: number, pad = 0) =>
  rects.some(
    (r) =>
      x > r.x - pad &&
      x < r.x + r.w + pad &&
      y > r.y - pad &&
      y < r.y + r.h + pad,
  );

const pawPath = new Path2D(
  'M240,108a28,28,0,1,1-28-28A28,28,0,0,1,240,108ZM72,108a28,28,0,1,0-28,28A28,28,0,0,0,72,108ZM92,88A28,28,0,1,0,64,60,28,28,0,0,0,92,88Zm72,0a28,28,0,1,0-28-28A28,28,0,0,0,164,88Zm23.12,60.86a35.3,35.3,0,0,1-16.87-21.14,44,44,0,0,0-84.5,0A35.25,35.25,0,0,1,69,148.82,40,40,0,0,0,88,224a39.48,39.48,0,0,0,15.52-3.13,64.09,64.09,0,0,1,48.87,0,40,40,0,0,0,34.73-72Z',
);

function paw(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number,
) {
  const k = (size * 1.45) / 208;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  ctx.scale(k, k);
  ctx.translate(-128, -132);
  ctx.fill(pawPath);
  ctx.restore();
}

function drawTrail(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ink: (alpha: number) => string,
  clear: Rect[],
) {
  const rand = mulberry32(4817);
  const noise = makeNoise(rand);
  const s = Math.max(7, Math.min(10, w / 130));
  const stride = s * 3;
  const gait = s * 0.75;
  const scale = 0.003;
  const pad = s * 2.6;
  const edge = (): [number, number, number] => {
    const e = (rand() * 4) | 0;
    const points: [number, number][] = [
      [0, rand() * h],
      [w, rand() * h],
      [rand() * w, 0],
      [rand() * w, h],
    ];
    const [x, y] = points[e]!;
    return [x, y, e];
  };
  const free = (px: number, py: number) =>
    px > s && py > s && px < w - s && py < h - s && !inside(clear, px, py, pad);
  const walk = (): Print[] => {
    const [x0, y0, e] = edge();
    const opposite = [1, 0, 3, 2][e]!;
    const goals: [number, number][] = [
      [0, h * (0.15 + rand() * 0.7)],
      [w, h * (0.15 + rand() * 0.7)],
      [w * (0.1 + rand() * 0.8), 0],
      [w * (0.1 + rand() * 0.8), h],
    ];
    const [gx, gy] = goals[opposite]!;
    let x = x0;
    let y = y0;
    let a = Math.atan2(gy - y, gx - x);
    const prints: Print[] = [];
    for (let i = 0; i < 400; i++) {
      const want =
        Math.atan2(gy - y, gx - x) + noise(x * scale, y * scale) * 1.1;
      const turn = Math.max(
        -0.3,
        Math.min(0.3, Math.atan2(Math.sin(want - a), Math.cos(want - a))),
      );
      let step: {
        na: number;
        nx: number;
        ny: number;
        px: number;
        py: number;
        side: number;
      } | null = null;
      for (const d of [0, 0.25, -0.25, 0.5, -0.5, 0.8, -0.8, 1.1, -1.1]) {
        const na = a + turn + d;
        const nx = x + Math.cos(na) * stride;
        const ny = y + Math.sin(na) * stride;
        const side = i % 2 ? 1 : -1;
        const px = nx + Math.cos(na + Math.PI / 2) * gait * side;
        const py = ny + Math.sin(na + Math.PI / 2) * gait * side;
        if (nx < -stride || ny < -stride || nx > w + stride || ny > h + stride)
          return prints;
        if (free(px, py)) {
          step = { na, nx, ny, px, py, side };
          break;
        }
        if (i < 2 && !inside(clear, px, py, pad)) {
          step = { na, nx, ny, px: NaN, py: NaN, side };
          break;
        }
      }
      if (!step) return prints;
      a = step.na;
      x = step.nx;
      y = step.ny;
      if (!Number.isNaN(step.px))
        prints.push([step.px, step.py, a + step.side * 0.1]);
    }
    return prints;
  };
  const hug = ([px, py]: Print) =>
    px < s * 4 ||
    py < s * 6 ||
    px > w - s * 4 ||
    py > h - s * 6 ||
    inside(clear, px, py, pad + s * 2);
  const score = (prints: Print[]) =>
    Math.min(prints.length, 22) - prints.filter(hug).length * 0.7;
  const best = Array.from({ length: 32 }, walk)
    .sort((p, q) => score(q) - score(p))[0]!
    .slice(0, 26);
  best.forEach(([px, py, angle], i) => {
    ctx.fillStyle = ink(0.12 + 0.12 * (i / Math.max(1, best.length - 1)));
    paw(ctx, px, py, angle, s * (0.94 + rand() * 0.12));
  });
}

function inkFor(host: HTMLElement) {
  const probe = document.createElement('span');
  probe.className = 'art__probe';
  host.append(probe);
  const [r, g, b] = getComputedStyle(probe)
    .color.match(/[\d.]+/g)!
    .map(Number);
  probe.remove();
  return (alpha: number) => `rgba(${r},${g},${b},${alpha})`;
}

function clearRects(host: HTMLElement): Rect[] {
  const box = host.getBoundingClientRect();
  const selector =
    'h1, h2, h3, p, li, dt, dd, a, button, .btn, figure, img, address, blockquote, label, aside';
  return [...host.querySelectorAll(selector)]
    .filter((el) => !el.closest('.art'))
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left - box.left,
        y: r.top - box.top,
        w: r.width,
        h: r.height,
      };
    })
    .filter((r) => r.w && r.h);
}

function mountArt(host: HTMLElement) {
  const layer = document.createElement('div');
  layer.className = 'art';
  layer.setAttribute('aria-hidden', 'true');
  host.prepend(layer);
  const dark = matchMedia('(prefers-color-scheme: dark)');
  let size = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  const render = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    const key = `${w}x${h}x${document.documentElement.dataset.theme}x${dark.matches}`;
    if (key === size) return;
    size = key;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    layer.replaceChildren(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    drawTrail(ctx, w, h, inkFor(host), clearRects(host));
  };
  new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(render, 150);
  }).observe(host);
  new MutationObserver(render).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  dark.addEventListener('change', render);
  void document.fonts.ready.then(render);
  render();
}

export function initArt(): void {
  for (const host of document.querySelectorAll<HTMLElement>('[data-art]'))
    mountArt(host);
}
