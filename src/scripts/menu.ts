import { eventElement } from './dom';

export function initMenu(): void {
  const head = document.querySelector('[data-menu]');
  const button = head?.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const label = button?.querySelector('[data-menu-label]');
  const nav = head?.querySelector('[data-menu-nav]');
  if (!head || !button || !label || !nav) return;
  const outside = [...document.body.children].filter(
    (el) => el !== head && !el.matches('script, template'),
  );
  const setOpen = (open: boolean) => {
    head.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Schließen' : 'Menü';
    for (const el of outside) el.toggleAttribute('inert', open);
    if (open)
      nav.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
  };
  matchMedia('(min-width: 75rem)').addEventListener('change', () =>
    setOpen(false),
  );
  button.addEventListener('click', () =>
    setOpen(!head.classList.contains('is-open')),
  );
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !head.classList.contains('is-open')) return;
    setOpen(false);
    button.focus({ preventScroll: true });
  });
  nav.addEventListener('click', (event) => {
    if (eventElement(event)?.closest('a')) setOpen(false);
  });
  document.addEventListener('click', (event) => {
    if (
      head.classList.contains('is-open') &&
      !head.contains(eventElement(event))
    )
      setOpen(false);
  });
}
