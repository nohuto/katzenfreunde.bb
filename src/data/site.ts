export const routes = {
  start: '/',
  vermittlung: '/pages/vermittlung.html',
  gefunden: '/pages/katze-gefunden.html',
  helfen: '/pages/spenden.html',
  aktuelles: '/pages/aktuelle-berichte.html',
  arbeit: '/pages/unsere-aktivitaeten.html',
  kontakt: '/pages/kontakt.html',
  daheim: '/pages/endlich-daheim.html',
  tipps: '/pages/tipps.html',
  mitglied: '/pages/mitglied-werden.html',
  impressum: '/pages/impressum.html',
  datenschutz: '/pages/datenschutz.html',
} as const;

export type PageKey = keyof typeof routes;

export const navigation: [PageKey, string][] = [
  ['start', 'Start'],
  ['vermittlung', 'Vermittlung'],
  ['gefunden', 'Katze gefunden?'],
  ['helfen', 'Helfen'],
  ['aktuelles', 'Aktuelles'],
  ['arbeit', 'Unsere Arbeit'],
  ['kontakt', 'Kontakt'],
];

export const navigationParent: Partial<Record<PageKey, PageKey>> = {
  daheim: 'arbeit',
  mitglied: 'helfen',
};

export const navigationSections: Partial<Record<PageKey, [string, string][]>> =
  {
    vermittlung: [
      [`${routes.vermittlung}#ablauf`, 'Ablauf'],
      [`${routes.vermittlung}#gebuehren`, 'Schutzgebühren'],
      [`${routes.vermittlung}#formulare`, 'Formulare'],
    ],
    gefunden: [
      [`${routes.gefunden}#verletzt`, 'Verletzt oder in Gefahr'],
      [`${routes.gefunden}#kitten`, 'Kätzchen ohne Mutter'],
      [`${routes.gefunden}#zutraulich`, 'Zutrauliche Katze'],
      [`${routes.gefunden}#streuner`, 'Scheue Streunerkatze'],
      [`${routes.gefunden}#tot`, 'Tote Katze'],
    ],
    helfen: [
      [`${routes.helfen}#spenden`, 'Geld spenden'],
      [routes.mitglied, 'Mitglied werden'],
      [`${routes.helfen}#pflege`, 'Pflegestelle werden'],
      [`${routes.helfen}#sachspenden`, 'Sachspenden'],
    ],
    arbeit: [
      [`${routes.arbeit}#tierarzt`, 'Tierärztliche Versorgung'],
      [`${routes.arbeit}#futterstellen`, 'Futterstellen'],
      [`${routes.arbeit}#flohmarkt`, 'Flohmarkt'],
      [routes.daheim, 'Endlich daheim'],
    ],
  };

export const contact = {
  phone: '07042 34355',
  tel: 'tel:+49704234355',
  whatsapp: '01577 2702827',
  whatsappHref: 'https://wa.me/4915772702827',
  mail: 'info@katzenfreunde-bietigheim-bissingen.de',
  mailHref: 'mailto:info@katzenfreunde-bietigheim-bissingen.de',
  fax: '07042 816627',
  street: 'Im Vogelsang 11',
  city: '74372 Sersheim',
  map: 'https://www.openstreetmap.org/search?query=Im%20Vogelsang%2011%2C%2074372%20Sersheim',
};

export const external = {
  instagram: 'https://www.instagram.com/katzenfreunde_bietigheim/',
  facebook: 'https://www.facebook.com/katzenfreundebibi/',
  tierschutzbund: 'https://www.tierschutzbund.de/',
  futterShuttle: 'https://www.futter-shuttle.de/',
  tierarztPraxis: 'https://www.tierarzt-bietigheim-bissingen.de/',
  source: 'https://github.com/nohuto/katzenfreunde.bb',
  paypal:
    'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=KG7YM244JCF2Q',
};

export const bank = {
  name: 'Katzenfreunde Bietigheim-Bissingen e. V.',
  iban: 'DE89604500500007884157',
  bic: 'SOLADES1LBG',
};

export const ibanGroups = (iban: string) => iban.replace(/.{4}(?=.)/g, '$& ');

export const membershipRates =
  'Mindestbeitrag pro Jahr: Erwachsene 25\u00A0€, Paare 35\u00A0€, Rentner sowie Schülerinnen und Schüler 10\u00A0€.';
