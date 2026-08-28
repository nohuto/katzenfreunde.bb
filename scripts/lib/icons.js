// Copyright (c) Nohuto (N.B.)
import { qsa } from "./dom.js";

export function iconFolderForTheme(theme) {
  return theme === "dark" ? "dark" : "light";
}

function ensureIconElement(target) {
  let icon = target.querySelector(".icon-glyph");
  if (!icon) {
    icon = document.createElement("img");
    icon.className = "icon-glyph";
    icon.alt = "";
    icon.setAttribute("aria-hidden", "true");
    target.prepend(icon);
  }
  return icon;
}

function hasInlineSvg(target) {
  return Boolean(target.querySelector("svg"));
}

export function setThemeIcon(target, fileName, folder, iconBase) {
  if (!target.querySelector(".icon-glyph") && hasInlineSvg(target)) {
    return;
  }
  const icon = ensureIconElement(target);
  icon.src = new URL(`${folder}/${fileName}.svg`, iconBase).href;
}

export function applyThemeIcons(theme, iconBase) {
  const folder = iconFolderForTheme(theme);
  const themeToggle = document.querySelector("[data-theme-toggle]");
  if (themeToggle) {
    const themeIcon = theme === "dark" ? "moon" : "sun";
    setThemeIcon(themeToggle, themeIcon, folder, iconBase);
  }

  qsa("[data-icon]").forEach((el) => {
    const iconName = el.getAttribute("data-icon");
    if (!iconName) return;
    setThemeIcon(el, iconName, folder, iconBase);
  });

  qsa(".copy-inline").forEach((el) => {
    setThemeIcon(el, "copy", folder, iconBase);
  });

  qsa("[data-modal-close]").forEach((el) => {
    setThemeIcon(el, "x", folder, iconBase);
  });
}
