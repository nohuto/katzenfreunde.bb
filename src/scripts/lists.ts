export function initDates(): void {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
  }).format(new Date());
  for (const list of document.querySelectorAll('[data-dates]')) {
    for (const item of list.querySelectorAll<HTMLElement>('[data-until]'))
      if ((item.dataset.until ?? '') < today) item.remove();
    if (!list.querySelector('[data-until]'))
      list.querySelector('[data-dates-empty]')?.removeAttribute('hidden');
  }
}

export function initCounts(): void {
  for (const feed of document.querySelectorAll('[data-count]')) {
    const rows = [...feed.querySelectorAll<HTMLElement>('[data-kind]')];
    for (const counter of feed.querySelectorAll<HTMLElement>('[data-n]')) {
      const kind = counter.dataset.n;
      counter.textContent = String(
        rows.filter((row) => kind === 'alle' || row.dataset.kind === kind)
          .length,
      );
    }
  }
}
