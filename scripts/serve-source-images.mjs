import { readFile } from 'node:fs/promises';
import path from 'node:path';

const imageSources = path.resolve('src/image-sources');

export function serveSourceImages() {
  return {
    name: 'katzenfreunde-source-images',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url || '/', 'http://localhost')
          .pathname;
        if (!/^\/assets\/[\w./-]+\.(?:jpe?g|png|webp)$/i.test(pathname))
          return next();
        const file = path.resolve(imageSources, pathname.slice(1));
        if (!file.startsWith(imageSources + path.sep)) return next();
        try {
          const data = await readFile(file);
          const extension = path.extname(file).toLowerCase();
          response.setHeader(
            'Content-Type',
            extension === '.png'
              ? 'image/png'
              : extension === '.webp'
                ? 'image/webp'
                : 'image/jpeg',
          );
          response.end(data);
        } catch {
          next();
        }
      });
    },
  };
}
