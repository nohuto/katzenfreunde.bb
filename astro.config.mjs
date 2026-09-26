import { defineConfig } from 'astro/config';
import { serveSourceImages } from './scripts/serve-source-images.mjs';

export default defineConfig({
  site: 'https://www.katzenfreunde-bietigheim-bissingen.de',
  build: { format: 'file' },
  compressHTML: true,
  vite: { plugins: [serveSourceImages()] },
});
