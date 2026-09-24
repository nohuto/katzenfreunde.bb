// Copyright (c) nohuto (N.B.)

import { qs, qsa, on, delegate } from "./dom.js";
import { setupPdfPreviews, setupPdfModal } from "./pdf.js";

const body = document.body;
const ACTIVE_PAGE_KEY = "kf-active-page-path";
const NOT_FOUND_KEY = "kf-not-found-path";

function setupNavigation() {
  const navToggle = qs("[data-nav-toggle]");
  const navWrap = qs("[data-nav-wrap]");
  const header = qs(".site-header");

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

  const dropdownItems = qsa(".has-dropdown");
  const setDropdownState = (item, open) => {
    item.classList.toggle("is-open", open);
    const toggle = item.querySelector(".nav-dropdown-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", String(open));
  };

  const closeAllDropdowns = () => {
    dropdownItems.forEach((item) => setDropdownState(item, false));
  };

  dropdownItems.forEach((item) => {
    const trigger = item.querySelector(".nav-link--dropdown");
    const toggle = item.querySelector(".nav-dropdown-toggle");
    if (!trigger || !toggle) return;

    trigger.removeAttribute("aria-expanded");
    trigger.removeAttribute("aria-haspopup");
    toggle.setAttribute("aria-haspopup", "true");
    toggle.setAttribute("aria-expanded", "false");

    on(toggle, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = item.classList.contains("is-open");
      closeAllDropdowns();
      setDropdownState(item, !isOpen);
    });

    on(toggle, "keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggle.click();
    });

    on(trigger, "click", () => {
      closeAllDropdowns();
      closeMobileNav();
    });

    item.querySelectorAll(".submenu a").forEach((link) =>
      on(link, "click", () => {
        closeAllDropdowns();
        closeMobileNav();
      })
    );
  });

  on(document, "click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target && target.closest(".has-dropdown")) return;
    closeAllDropdowns();

    if (!isMobileNav() || !header || !target) return;
    if (target.closest(".site-header")) return;
    closeMobileNav();
  });

  on(document, "keydown", (event) => {
    if (event.key !== "Escape") return;
    closeAllDropdowns();
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
let transientThemeOverride = null;

function readThemeOverride() {
  try {
    const value = sessionStorage.getItem(THEME_OVERRIDE_KEY);
    if (value === "light" || value === "dark") {
      transientThemeOverride = value;
      return value;
    }
    return transientThemeOverride;
  } catch (_) {
    return transientThemeOverride;
  }
}

function writeThemeOverride(theme) {
  const normalized = theme === "light" || theme === "dark" ? theme : null;
  transientThemeOverride = normalized;

  try {
    if (normalized) {
      sessionStorage.setItem(THEME_OVERRIDE_KEY, normalized);
    } else {
      sessionStorage.removeItem(THEME_OVERRIDE_KEY);
    }
  } catch (_) {
  }
}

function readSystemTheme() {
  const prefersDark =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function bindSystemThemeSync(onChange) {
  const systemThemeQuery =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
  if (!systemThemeQuery) return () => { };

  const handleChange = () => {
    if (readThemeOverride()) return;
    onChange(readSystemTheme());
  };

  if (typeof systemThemeQuery.addEventListener === "function") {
    systemThemeQuery.addEventListener("change", handleChange);
    return () => systemThemeQuery.removeEventListener("change", handleChange);
  }

  if (typeof systemThemeQuery.addListener === "function") {
    systemThemeQuery.addListener(handleChange);
    return () => systemThemeQuery.removeListener(handleChange);
  }

  return () => { };
}

function resolveTheme() {
  const override = readThemeOverride();
  const systemTheme = readSystemTheme();
  if (override && override === systemTheme) {
    writeThemeOverride(null);
    return systemTheme;
  }
  return override || systemTheme;
}

function setTheme(theme) {
  root.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
}

function setupTheme() {
  setTheme(resolveTheme());

  const themeToggle = qs("[data-theme-toggle]");
  bindSystemThemeSync(setTheme);

  if (!themeToggle) return;

  on(themeToggle, "click", () => {
    const current = root.getAttribute("data-theme") || "light";
    const nextTheme = current === "dark" ? "light" : "dark";
    const systemTheme = readSystemTheme();

    if (nextTheme === systemTheme) {
      writeThemeOverride(null);
      setTheme(systemTheme);
      return;
    }

    writeThemeOverride(nextTheme);
    setTheme(nextTheme);
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
  const modal = document.createElement("div");
  modal.className = "modal open";
  modal.innerHTML = `
    <div class="modal__backdrop" data-not-found-close></div>
    <div class="modal__dialog modal__dialog--compact" role="alertdialog" aria-modal="true" aria-labelledby="not-found-title" aria-describedby="not-found-message">
      <div class="modal__head">
        <p class="modal__title" id="not-found-title">404</p>
        <div class="modal__actions">
          <button aria-label="Schließen" class="modal__close modal__close--icon" data-icon="x" data-not-found-close type="button"></button>
        </div>
      </div>
      <div class="modal__body">
        <p id="not-found-message">Die angeforderte Seite wurde nicht gefunden.</p>
        <code class="modal__path"></code>
      </div>
    </div>`;
  qs(".modal__path", modal).textContent = readablePath(path);

  const closeButton = qs("button[data-not-found-close]", modal);
  const returnFocus = document.activeElement;
  const close = () => {
    modal.remove();
    body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    if (returnFocus instanceof HTMLElement) returnFocus.focus({ preventScroll: true });
  };
  const onKeydown = (event) => {
    if (event.key === "Escape") {
      close();
    } else if (event.key === "Tab") {
      event.preventDefault();
      closeButton.focus();
    }
  };

  qsa("[data-not-found-close]", modal).forEach((element) => on(element, "click", close));
  document.addEventListener("keydown", onKeydown);
  body.append(modal);
  body.style.overflow = "hidden";
  closeButton.focus({ preventScroll: true });
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
