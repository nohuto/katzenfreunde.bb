import type { APIRoute } from 'astro';
import { routes } from '../data/site';

export const GET: APIRoute = ({ site }) => {
  const urls = Object.values(routes).map(
    (path) => `  <url><loc>${new URL(path, site)}</loc></url>`,
  );
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
