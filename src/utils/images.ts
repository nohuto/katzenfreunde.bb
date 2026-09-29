import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

const sources = import.meta.glob<{ default: ImageMetadata }>(
  '../image-sources/**/*.{jpg,png,webp}',
  { eager: true },
);

const widths = [480, 800, 1200, 1600, Infinity];

export function sourceImage(path: string): ImageMetadata {
  const source = sources[`../image-sources${path}`];
  if (!source)
    throw new Error(`Missing image source: src/image-sources${path}`);
  return source.default;
}

export async function webpImage(path: string, width?: number) {
  const image = await getImage({
    src: sourceImage(path),
    format: 'webp',
    quality: 82,
    ...(width ? { width, densities: [1, 2, 3] } : { widths }),
  });
  return {
    src: image.src,
    srcset: image.srcSet.values.length > 1 ? image.srcSet.attribute : undefined,
    width: Number(image.attributes.width),
    height: Number(image.attributes.height),
  };
}
