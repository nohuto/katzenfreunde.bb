const weekdays = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
];
const months = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];
const monthsShort = [
  'Jan.',
  'Feb.',
  'März',
  'Apr.',
  'Mai',
  'Juni',
  'Juli',
  'Aug.',
  'Sep.',
  'Okt.',
  'Nov.',
  'Dez.',
];

const records = [
  {
    date: '2026-11-07',
    title: 'Flohmarkt',
    short: 'Flohmarkt am Kuhbrunnen',
    from: '10',
    to: '16',
    place: 'Am Kuhbrunnen in der Altstadt Bietigheim',
    placeInline: 'am Kuhbrunnen in der Bietigheimer Altstadt',
  },
  {
    date: '2026-11-28',
    title: 'Adventsbasar mit Flohmarkt',
    short: 'Adventsbasar in Unterriexingen',
    from: '9:30',
    to: '15:30',
    place:
      'Besen am Backhäusle, Enge Gasse 1, 71706 Markgröningen-Unterriexingen',
    placeInline:
      'im Besen am Backhäusle, Enge Gasse 1, 71706 Markgröningen-Unterriexingen',
  },
];

export const events = records.map((event) => {
  const date = new Date(`${event.date}T12:00:00Z`);
  const weekday = weekdays[date.getUTCDay()] ?? '';
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()] ?? '';
  const year = date.getUTCFullYear();
  return {
    ...event,
    weekday,
    weekdayShort: weekday.slice(0, 2),
    day,
    month,
    monthShort: monthsShort[date.getUTCMonth()] ?? '',
    year,
    longDate: `${weekday}, ${day}.\u00a0${month} ${year}`,
    hours: `${event.from}-${event.to}\u00a0Uhr`,
  };
});
