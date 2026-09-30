import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://katzenfreunde-bietigheim-bissingen.de',
  build: { format: 'file' },
  compressHTML: true,
});
