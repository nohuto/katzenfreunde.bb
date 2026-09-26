// Copyright (c) nohuto (N.B.)

import { qs, qsa, on, delegate } from "./dom.js";
import { setupPdfPreviews, setupPdfModal } from "./pdf.js";

const body = document.body;
const ACTIVE_PAGE_KEY = "kf-active-page-path";
const NOT_FOUND_KEY = "kf-not-found-path";

function setupNavigation() {
  const navToggle = qs("[data-nav-toggle]");
  const navWrap = qs("[data-nav-wrap]");

  const isMobileNav = () =>
    window.matchMedia && window.matchMedia("(max-width: 1100px)").matches;

  let navClose = null;

  if (navToggle) {
    const toggleLabel =
      (navToggle.textContent || "").trim() ||
      navToggle.getAttribute("aria-label") ||
      "Menu";
    navToggle.textContent = "";
    navToggle.setAttribute("aria-label", toggleLabel);
  }

  if (navWrap) {
    navWrap.setAttribute("aria-hidden", isMobileNav() ? "true" : "false");

    let drawerHead = qs(".nav-drawer-head", navWrap);
    if (!drawerHead) {
      drawerHead = document.createElement("div");
      drawerHead.className = "nav-drawer-head";
      navWrap.prepend(drawerHead);
    }

    let drawerFoot = qs(".nav-drawer-foot", navWrap);
    if (!drawerFoot) {
      drawerFoot = document.createElement("div");
      drawerFoot.className = "nav-drawer-foot";
      navWrap.appendChild(drawerFoot);
    }

    let drawerQuick = qs(".nav-drawer-quick", drawerFoot);
    if (!drawerQuick) {
      drawerQuick = document.createElement("div");
      drawerQuick.className = "nav-drawer-quick";
      drawerFoot.appendChild(drawerQuick);

      const quickItems = [
        { kind: "link", icon: "phone", label: "Telefon anrufen", href: "tel:+49704234355" },
        {
          kind: "button",
          icon: "mail",
          label: "E-Mail kopieren",
          copyEmail: "info@katzenfreunde-bietigheim-bissingen.de",
        },
        {
          kind: "link",
          icon: "brand-whatsapp",
          label: "WhatsApp",
          href: "https://wa.me/4915772702827",
          external: true,
        },
        {
          kind: "link",
          icon: "brand-facebook",
          label: "Facebook",
          href: "https://www.facebook.com/katzenfreundebibi/",
          external: true,
        },
        {
          kind: "link",
          icon: "brand-instagram",
          label: "Instagram",
          href: "https://www.instagram.com/katzenfreunde_bietigheim/",
          external: true,
        },
      ];

      quickItems.forEach((item) => {
        const el =
          item.kind === "button"
            ? document.createElement("button")
            : document.createElement("a");

        if (item.kind === "button") {
          el.type = "button";
          el.className = "icon-btn nav-drawer-quick__icon";
          el.setAttribute("data-copy-email", item.copyEmail || "");
        } else {
          el.className = "icon-link nav-drawer-quick__icon";
          el.setAttribute("href", item.href || "#");
          if (item.external) {
            el.setAttribute("target", "_blank");
            el.setAttribute("rel", "noopener noreferrer");
          }
        }

        el.setAttribute("data-icon", item.icon);
        el.setAttribute("aria-label", item.label);
        drawerQuick.appendChild(el);
      });
    }

    navClose = qs("[data-nav-close]", navWrap);
    if (!navClose) {
      navClose = document.createElement("button");
      navClose.type = "button";
      navClose.className = "nav-drawer-close";
      navClose.setAttribute("data-nav-close", "");
      navClose.setAttribute("data-icon", "x");
      navClose.setAttribute("aria-label", "Menü schließen");
      drawerHead.appendChild(navClose);
    }
  }

  const closeMobileNav = () => {
    if (!navToggle || !navWrap) return;
    navWrap.classList.remove("open");
    navWrap.setAttribute("aria-hidden", isMobileNav() ? "true" : "false");
    navToggle.setAttribute("aria-expanded", "false");
    body.classList.remove("nav-drawer-open");
  };

  if (navToggle && navWrap) {
    on(navToggle, "click", () => {
      const isOpen = navWrap.classList.toggle("open");
      navWrap.setAttribute("aria-hidden", isOpen ? "false" : "true");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      body.classList.toggle("nav-drawer-open", isOpen);

      if (isOpen && navClose) {
        navClose.focus({ preventScroll: true });
      }
    });
  }

  if (navClose) {
    on(navClose, "click", () => {
      closeMobileNav();
      if (navToggle) navToggle.focus({ preventScroll: true });
    });
  }

  const dropdown = qs(".has-dropdown");
  const dropdownToggle = qs(".nav-dropdown-toggle");
  const setDropdown = (open) => {
    if (!dropdown || !dropdownToggle) return;
    dropdown.classList.toggle("is-open", open);
    dropdownToggle.setAttribute("aria-expanded", String(open));
  };

  on(dropdownToggle, "click", () => setDropdown(!dropdown.classList.contains("is-open")));

  delegate("click", ".nav-wrap a", () => {
    setDropdown(false);
    closeMobileNav();
  });

  on(document, "click", ({ target }) => {
    if (!(target instanceof Element) || target.closest(".has-dropdown")) return;
    setDropdown(false);
    if (isMobileNav() && !target.closest(".site-header")) closeMobileNav();
  });

  on(document, "keydown", (event) => {
    if (event.key !== "Escape") return;
    setDropdown(false);
    closeMobileNav();
  });

  on(window, "resize", () => {
    if (isMobileNav()) return;
    closeMobileNav();
    if (navWrap) navWrap.setAttribute("aria-hidden", "false");
  });
}

const root = document.documentElement;
const THEME_OVERRIDE_KEY = "theme_override";

const systemTheme = () => (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function setThemeOverride(theme) {
  if (theme) root.dataset.theme = theme;
  else delete root.dataset.theme;
  try {
    if (theme) sessionStorage.setItem(THEME_OVERRIDE_KEY, theme);
    else sessionStorage.removeItem(THEME_OVERRIDE_KEY);
  } catch (_) {
  }
}

function setupTheme() {
  on(qs("[data-theme-toggle]"), "click", () => {
    const next = (root.dataset.theme || systemTheme()) === "dark" ? "light" : "dark";
    setThemeOverride(next === systemTheme() ? null : next);
  });
}

function createToast() {
  const toast = qs("[data-toast]");
  if (!toast) return () => { };

  let timer = null;
  return (message) => {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  };
}

function copyText(textToCopy) {
  if (!textToCopy) return Promise.reject(new Error("no text"));

  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(textToCopy);
  }

  const el = document.createElement("textarea");
  el.value = textToCopy;
  el.setAttribute("readonly", "");
  el.className = "hidden";
  document.body.appendChild(el);
  el.select();

  try {
    document.execCommand("copy");
    document.body.removeChild(el);
    return Promise.resolve();
  } catch (err) {
    document.body.removeChild(el);
    return Promise.reject(err);
  }
}

function setupCopyButtons(showToast) {
  delegate("click", "[data-copy-email], [data-copy-text]", (event, target) => {
    if (target.tagName.toLowerCase() === "a") {
      event.preventDefault();
    }

    const value = target.getAttribute("data-copy-text") || target.getAttribute("data-copy-email");
    copyText(value)
      .then(() => showToast(`Kopiert: ${value}`))
      .catch(() => showToast(`Kopieren nicht möglich. Wert: ${value}`));
  });
}

function prefersReducedMotion() {
  return Boolean(
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function setupPawClicks() {
  if (prefersReducedMotion()) return;

  const selector = "button, .btn, .icon-btn, .icon-link, .theme-toggle, .main-nav a, .submenu a";
  delegate("pointerdown", selector, (event) => {
    const paw = document.createElement("span");
    paw.className = "paw-click";
    paw.style.left = `${event.clientX}px`;
    paw.style.top = `${event.clientY}px`;
    body.appendChild(paw);

    setTimeout(() => paw.remove(), 600);
  });
}

function rememberActivePage() {
  try {
    sessionStorage.setItem(ACTIVE_PAGE_KEY, location.pathname === "/" ? "/index.html" : location.pathname);
  } catch (_) {
  }
}

function consumeNotFoundPath() {
  try {
    const path = sessionStorage.getItem(NOT_FOUND_KEY) || "";
    sessionStorage.removeItem(NOT_FOUND_KEY);
    return path;
  } catch (_) {
    return "";
  }
}

function readablePath(path) {
  try {
    return decodeURI(path);
  } catch (_) {
    return path;
  }
}

function showNotFoundDialog(path) {
  const dialog = document.createElement("dialog");
  dialog.className = "modal__dialog modal__dialog--compact";
  dialog.setAttribute("role", "alertdialog");
  dialog.setAttribute("aria-labelledby", "not-found-title");
  dialog.setAttribute("aria-describedby", "not-found-message");
  dialog.innerHTML = `
    <div class="modal__head">
      <p class="modal__title" id="not-found-title">404</p>
      <form class="modal__actions" method="dialog">
        <button aria-label="Schließen" class="modal__close modal__close--icon" data-icon="x"></button>
      </form>
    </div>
    <div class="modal__body">
      <p id="not-found-message">Die angeforderte Seite wurde nicht gefunden.</p>
      <code class="modal__path"></code>
    </div>`;
  qs(".modal__path", dialog).textContent = readablePath(path);
  on(dialog, "click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  on(dialog, "close", () => dialog.remove());
  body.append(dialog);
  dialog.showModal();
}

const notFoundPath = consumeNotFoundPath();
rememberActivePage();

setupNavigation();
setupTheme();

const showToast = createToast();
setupCopyButtons(showToast);
setupPdfPreviews();
setupPdfModal();
setupPawClicks();

if (notFoundPath) showNotFoundDialog(notFoundPath);
