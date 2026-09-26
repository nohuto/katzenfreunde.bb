import { qs, on } from './dom';

const root = document.documentElement;
const THEME_OVERRIDE_KEY = "theme_override";

const systemTheme = () => (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function setThemeOverride(theme: string | null) {
  if (theme) root.dataset.theme = theme;
  else delete root.dataset.theme;
  try {
    if (theme) sessionStorage.setItem(THEME_OVERRIDE_KEY, theme);
    else sessionStorage.removeItem(THEME_OVERRIDE_KEY);
  } catch (_) {
  }
}

export function setupTheme() {
  on(qs("[data-theme-toggle]"), "click", () => {
    const next = (root.dataset.theme || systemTheme()) === "dark" ? "light" : "dark";
    setThemeOverride(next === systemTheme() ? null : next);
  });
}
