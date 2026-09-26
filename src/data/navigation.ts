export const mainLinks = [
  { key: 'home', label: 'Startseite', href: '/index.html' },
  { key: 'termine', label: 'Termine', href: '/pages/termine.html' },
  {
    key: 'aktivitaeten',
    label: 'Unsere Aktivitäten',
    href: '/pages/unsere-aktivitaeten.html',
  },
  { key: 'vermittlung', label: 'Vermittlung', href: '/pages/vermittlung.html' },
  { key: 'berichte', label: 'Berichte', href: '/pages/aktuelle-berichte.html' },
  {
    key: 'mitgliedschaft',
    label: 'Mitgliedschaft',
    href: '/pages/mitglied-werden.html',
  },
  { key: 'spenden', label: 'Spenden', href: '/pages/spenden.html' },
  { key: 'tipps', label: 'Tipps', href: '/pages/tipps.html' },
  { key: 'kontakt', label: 'Kontakt', href: '/pages/kontakt.html' },
] as const;

export const activityLinks = [
  { label: 'Flohmarkt', href: '/pages/flohmaerkte.html' },
  {
    label: 'Tierärztliche Versorgung',
    href: '/pages/tieraerztl-versorgung.html',
  },
  { label: 'Futterstellen', href: '/pages/futterstellen.html' },
  { label: 'Katzenvermittlung', href: '/pages/katzenvermittlung.html' },
  { label: 'Schutzgebühren', href: '/pages/schutzgebuehren.html' },
  { label: 'Endlich daheim', href: '/pages/endlich-daheim.html' },
  { label: 'Futter Shop', href: '/pages/futter-shop.html' },
] as const;

const activityPages = new Set([
  'unsere-aktivitaeten',
  'flohmaerkte',
  'tieraerztl-versorgung',
  'futterstellen',
  'katzenvermittlung',
  'schutzgebuehren',
  'endlich-daheim',
  'futter-shop',
]);

export function sectionForPage(page: string): string {
  if (activityPages.has(page)) return 'aktivitaeten';
  if (page === 'mitglied-werden') return 'mitgliedschaft';
  return page;
}
