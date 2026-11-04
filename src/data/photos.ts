import type { ImageMetadata } from 'astro';

const sources = import.meta.glob<{ default: ImageMetadata }>(
  '../image-sources/**/*.{jpg,png,webp}',
  { eager: true },
);

const files: Record<string, string> = {
  'daheim-benno-leni': 'assets/media/resources/benno-leni.jpg',
  'daheim-pinkus': 'assets/media/resources/pinkus-zuhause.png',
  'daheim-peggy': 'assets/media/resources/peggy-zuhause.png',
  'daheim-mieke': 'assets/media/resources/mieke-zuhause.jpg',
  'daheim-balu-baghira': 'assets/media/resources/balu-und-baghira-zuhause.png',
  'daheim-sammy': 'assets/media/resources/sammy-zuhause.jpg',
  'daheim-maja-willi-1': 'assets/media/resources/maja-und-willi-1.jpg',
  'daheim-maja-willi-2': 'assets/media/resources/maja-und-willi-2.jpg',
  'daheim-mia-portraet':
    'assets/media/resources/mia-prinzessin-seidenfell-portraet.jpg',
  'daheim-lilly-portraet':
    'assets/media/resources/lilly-ella-rabiata-portraet.jpg',
  'daheim-mia': 'assets/media/resources/mia-prinzessin-seidenfell.jpg',
  'daheim-geschwister-1':
    'assets/media/resources/endlich-daheim-geschwister-1.jpg',
  'daheim-geschwister-2':
    'assets/media/resources/endlich-daheim-geschwister-2.jpg',
  'daheim-geschwister-3':
    'assets/media/resources/endlich-daheim-geschwister-3.jpg',
  'daheim-gruppe-1': 'assets/media/resources/endlich-daheim-katzengruppe-1.jpg',
  'daheim-gruppe-2': 'assets/media/resources/endlich-daheim-katzengruppe-2.jpg',
  'daheim-zuhause': 'assets/media/resources/mitgliedschaft-katze-zuhause.jpg',
  'bericht-katzenbaby-1': 'assets/media/resources/gerettetes-katzenbaby-1.jpg',
  'bericht-katzenbaby-2': 'assets/media/resources/gerettetes-katzenbaby-2.jpg',
  'bericht-piroschkas': 'assets/media/resources/katzenkinder-piroschkas.jpg',
  'bericht-spende400': 'assets/media/resources/spendenbericht-400-euro.jpg',
  'tierarzt-schoppenkatze':
    'assets/media/resources/ehrung-jutta-framenau-1.jpg',
  'tierarzt-projektil':
    'assets/media/resources/tieraerztliche-versorgung-projektil.jpg',
  'tierarzt-schnupfen':
    'assets/media/resources/tieraerztliche-versorgung-katzenschnupfen.jpg',
  'tierarzt-schur':
    'assets/media/resources/tieraerztliche-versorgung-katzenschur.jpg',
  'tierarzt-ohr':
    'assets/media/resources/tieraerztliche-versorgung-ohramputation.jpg',
  'tierarzt-wuermer':
    'assets/media/resources/tieraerztliche-versorgung-wuermer.jpg',
  'tierarzt-praxis-logo':
    'assets/media/resources/tierarztpraxis-bietigheim-bissingen-logo.webp',
  'flohmarkt-stand-2': 'assets/media/resources/flohmarkt-seitenmotiv-2.jpg',
  'ratgeber-garten': 'assets/media/resources/katzenratgeber-seitenbild.jpg',
  'katze-getigert':
    'assets/media/resources/junge-getigerte-katze-vermittlung.webp',
  'franzi-portraet': 'assets/media/resources/franzi-vermittlung.webp',
  'franzi-liegend': 'assets/media/resources/franzi-vermittlung-2.webp',
  einfangaktion: 'assets/media/resources/einfangaktion-zwei-helferinnen.jpg',
  futterstelle: 'assets/media/resources/futterstelle-miri.jpg',
  'vereinsarchiv-garten':
    'assets/media/resources/spenden-vereinsarchiv-katze.jpg',
  'flohmarkt-stand': 'assets/media/resources/flohmarkt-seitenmotiv-1.jpg',
  'plakat-pflegestellen': 'assets/media/resources/katzenvermittlung1.jpg',
  'plakat-danke-mai2026': 'assets/media/resources/mai2026.jpg',
  'stock-schlafende-katze': 'stock/schlafende-katze.jpg',
  'stock-banner-breit': 'stock/schlafende-katze-breit.jpg',
  'stock-katze-draussen': 'stock/streunerkatze-nafplio.jpg',
};

export function photo(name: string): ImageMetadata {
  const file = files[name];
  const source = file ? sources[`../image-sources/${file}`] : undefined;
  if (!source) throw new Error(`Missing photo: ${name}`);
  return source.default;
}
