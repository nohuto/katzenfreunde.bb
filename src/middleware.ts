import { defineMiddleware } from 'astro:middleware';

const entities: Record<string, string> = {
  amp: '&',
  auml: 'ä',
  Auml: 'ä',
  ouml: 'ö',
  Ouml: 'ö',
  uuml: 'ü',
  Uuml: 'ü',
  szlig: 'ß',
};

const umlauts: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
};

function slug(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&(\w+);/g, (_, name: string) => entities[name] ?? ' ')
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => umlauts[char] ?? char)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function identifyHeadings(html: string): string {
  const used = new Set(
    Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => match[1]),
  );
  return html.replace(
    /<(h[23])(\s[^>]*)?>([\s\S]*?)<\/\1>/g,
    (heading, tag: string, attrs = '', inner: string) => {
      const base = slug(inner);
      if (/\sid="/.test(attrs) || !base) return heading;
      let id = base;
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
      used.add(id);
      return `<${tag} id="${id}"${attrs}>${inner}</${tag}>`;
    },
  );
}

export const onRequest = defineMiddleware(async (_, next) => {
  const response = await next();
  if (!response.headers.get('content-type')?.includes('text/html')) {
    return response;
  }
  return new Response(identifyHeadings(await response.text()), response);
});
