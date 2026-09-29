import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.katzenfreunde-bietigheim-bissingen.de',
  build: { format: 'file' },
  compressHTML: true,
});
