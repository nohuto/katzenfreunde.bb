// Copyright (c) nohuto (N.B.)
import { qs, qsa, on, delegate } from "./lib/dom.js";
import { copyText } from "./lib/copy.js";

const root = document.documentElement;
const body = document.body;
const THEME_OVERRIDE_KEY = "theme_override";
let transientThemeOverride = null;

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
    // Ignore storage errors (privacy mode / browser restrictions).
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

function initTheme() {
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

function setupToasts() {
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

function prefersReducedMotion() {
  return Boolean(
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function setupCopy(showToast) {
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

function normalizePdfUrl(url) {
  const value = (url || "").trim();
  if (!value || value === "#") return "";
  return value;
}

function prefersNativePdfOpen() {
  return Boolean(
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches
  );
}

function buildInlinePdfPreviewUrl(url) {
  const value = normalizePdfUrl(url);
  if (!value) return "";
  const [base, hash = ""] = value.split("#", 2);
  const fragment = hash ? `${hash}&` : "";
  return `${base}#${fragment}view=FitH&toolbar=0&navpanes=0&pagemode=none`;
}

function setupInlinePdfPreviews() {
  const cards = qsa(".pdf-inline-card[data-pdf]");
  if (!cards.length) return;
  const prefersNativePdf = prefersNativePdfOpen();

  const maxConcurrentLoads = 2;
  let activeLoads = 0;
  const queue = [];

  const pumpQueue = () => {
    while (activeLoads < maxConcurrentLoads && queue.length) {
      const card = queue.shift();
      if (!card || card.getAttribute("data-pdf-preview-state") === "loaded") continue;

      const frame = qs(".pdf-inline-card__frame", card);
      const rawUrl = card.getAttribute("data-pdf") || card.getAttribute("href");
      const previewUrl = buildInlinePdfPreviewUrl(rawUrl);
      if (!frame || !previewUrl) {
        card.setAttribute("data-pdf-preview-state", "error");
        continue;
      }

      const title = (card.getAttribute("data-title") || "PDF-Vorschau").trim();
      const iframe = document.createElement("iframe");
      iframe.setAttribute("src", previewUrl);
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("title", `${title} Vorschau`);
      iframe.setAttribute("aria-hidden", "true");
      iframe.setAttribute("tabindex", "-1");

      activeLoads += 1;
      card.setAttribute("data-pdf-preview-state", "loading");

      let finished = false;
      const finish = (state) => {
        if (finished) return;
        finished = true;
        activeLoads = Math.max(0, activeLoads - 1);
        card.setAttribute("data-pdf-preview-state", state);
        pumpQueue();
      };

      on(iframe, "load", () => finish("loaded"), { once: true });
      on(iframe, "error", () => finish("error"), { once: true });
      window.setTimeout(() => finish("loaded"), 5000);

      frame.innerHTML = "";
      frame.appendChild(iframe);
    }
  };

  const requestPreviewLoad = (card) => {
    const state = card.getAttribute("data-pdf-preview-state");
    if (state === "queued" || state === "loading" || state === "loaded") return;
    card.setAttribute("data-pdf-preview-state", "queued");
    queue.push(card);
    pumpQueue();
  };

  cards.forEach((card) => {
    const pdfUrl = normalizePdfUrl(card.getAttribute("data-pdf") || card.getAttribute("href"));
    const href = (card.getAttribute("href") || "").trim();
    if (pdfUrl && (!href || href === "#")) {
      card.setAttribute("href", pdfUrl);
    }
    if (prefersNativePdf) return;

    on(card, "pointerenter", () => requestPreviewLoad(card), { passive: true });
    on(card, "focusin", () => requestPreviewLoad(card));
    on(card, "touchstart", () => requestPreviewLoad(card), {
      passive: true,
      once: true,
    });
  });

  if (prefersNativePdf) return;

  if (!("IntersectionObserver" in window)) {
    cards.slice(0, 2).forEach((card) => requestPreviewLoad(card));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        requestPreviewLoad(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "180px 0px", threshold: 0.06 }
  );

  cards.forEach((card) => observer.observe(card));
}

function setupPdfModal() {
  const modal = qs("[data-pdf-modal]");
  const modalBackdrop = modal ? qs("[data-modal-backdrop]", modal) : null;
  const modalClose = modal ? qs("[data-modal-close]", modal) : null;
  const modalTitle = modal ? qs("[data-modal-title]", modal) : null;
  const modalFrame = modal ? qs("[data-modal-frame]", modal) : null;

  if (!modal || !modalTitle || !modalFrame) return;
  let returnFocus = null;

  qsa(".pdf-preview[data-pdf]").forEach((link) => {
    const pdfUrl = (link.getAttribute("data-pdf") || "").trim();
    const href = (link.getAttribute("href") || "").trim();
    if (pdfUrl && (!href || href === "#")) {
      link.setAttribute("href", pdfUrl);
    }
  });

  const openPdf = (url, title, trigger) => {
    const pdfUrl = normalizePdfUrl(url);
    if (!pdfUrl) return;
    returnFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
    modalTitle.textContent = title || "PDF-Vorschau";
    if (modalFrame.getAttribute("data-current-pdf") !== pdfUrl) {
      modalFrame.setAttribute("src", pdfUrl);
      modalFrame.setAttribute("data-current-pdf", pdfUrl);
    }
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    body.style.overflow = "hidden";
    if (modalClose) modalClose.focus({ preventScroll: true });
  };

  const closePdf = () => {
    if (!modal.classList.contains("open")) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    body.style.overflow = "";
    if (returnFocus instanceof HTMLElement) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  };

  delegate("click", ".pdf-preview", (event, link) => {
    const url = link.getAttribute("data-pdf") || link.getAttribute("href");
    const pdfUrl = normalizePdfUrl(url);
    if (!pdfUrl) return;

    const prefersNativePdf = prefersNativePdfOpen();
    if (prefersNativePdf) {
      event.preventDefault();
      link.setAttribute("href", pdfUrl);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener");
      const opened = window.open(pdfUrl, "_blank", "noopener");
      if (!opened) {
        window.location.href = pdfUrl;
      }
      return;
    }

    event.preventDefault();
    const title = link.getAttribute("data-title") || link.textContent.trim();
    openPdf(pdfUrl, title, link);
  });

  if (modalBackdrop) on(modalBackdrop, "click", closePdf);
  if (modalClose) on(modalClose, "click", closePdf);

  on(document, "keydown", (event) => {
    if (event.key === "Escape") {
      closePdf();
      return;
    }
    if (event.key !== "Tab" || !modal.classList.contains("open")) return;

    const focusable = qsa("button, [href], iframe, [tabindex]:not([tabindex='-1'])", modal)
      .filter(element => !element.hasAttribute("disabled"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  on(window, "pagehide", () => {
    modalFrame.setAttribute("src", "about:blank");
    modalFrame.removeAttribute("data-current-pdf");
  });

}

function setupClickPaw() {
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

function boot() {
  setupNavigation();
  initTheme();

  const showToast = setupToasts();
  setupCopy(showToast);
  setupInlinePdfPreviews();
  setupPdfModal();
  setupClickPaw();
}

boot();
