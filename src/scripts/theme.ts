import { eventElement } from './dom';
import { storageRemove, storageSet } from './storage';

const root = document.documentElement;
const THEME_KEY = 'theme_override';

function syncThemeColor(): void {
  const auto = root.dataset.theme === 'auto';
  const color = getComputedStyle(document.body).backgroundColor;
  for (const meta of document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  )) {
    meta.dataset.auto ??= meta.content;
    meta.content = auto ? meta.dataset.auto : color;
  }
}

export function initTheme(): void {
  syncThemeColor();
  const group = document.querySelector('[data-theme-group]');
  if (!group) return;
  const buttons = [
    ...group.querySelectorAll<HTMLButtonElement>('[data-theme-set]'),
  ];
  const mark = () => {
    for (const button of buttons)
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.themeSet === root.dataset.theme),
      );
  };
  group.addEventListener('click', (event) => {
    const theme =
      eventElement(event)?.closest<HTMLButtonElement>('[data-theme-set]')
        ?.dataset.themeSet;
    if (!theme) return;
    root.dataset.theme = theme;
    if (theme === 'auto') storageRemove(THEME_KEY);
    else storageSet(THEME_KEY, theme);
    syncThemeColor();
    mark();
  });
  mark();
}
