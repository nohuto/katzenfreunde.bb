// Copyright (c) Nohuto (N.B.)
import { qs, qsa, on, delegate } from "./lib/dom.js";
import { applyThemeIcons } from "./lib/icons.js";
import { copyText } from "./lib/copy.js";

const root = document.documentElement;
const body = document.body;
const iconBase = new URL("/assets/icons/", window.location.origin);
const bannerBase = new URL("/assets/banners/", window.location.origin);
const THEME_OVERRIDE_KEY = "theme_override";
let transientThemeOverride = null;

const text = {
  tagline: "Wir helfen Katzen in Not",
  menuToggle: "Menü",
  navHome: "Startseite",
  navReports: "Berichte",
  navDates: "Termine",
  navActivities: "Unsere Aktivitäten",
  navPlacement: "Vermittlung",
  navMembership: "Mitgliedschaft",
  navDonate: "Spenden",
  navTips: "Tipps",
  navContact: "Kontakt",
  navActivitiesToggle: "Untermenü umschalten",
  legalImpressum: "Impressum",
  legalPrivacy: "Datenschutz",
  footerRights: "© 2026 Katzenfreunde Bietigheim-Bissingen e.V. Alle Rechte vorbehalten.",
  modalTitle: "PDF Vorschau",
  modalClose: "Schließen",
  copyEmail: "E-Mail kopieren",
  themeAria: "Farbmodus wechseln",
  termHeroTitle: "Termine im Überblick",
  termHeroText:
    "Alle aktuellen Flohmarkt- und Aktionstermine finden Sie hier gesammelt. Bei kurzfristigen Änderungen kontaktieren Sie uns bitte direkt.",
  termDatesTitle: "Flohmarkttermine 2026",
  termInfoTitle: "Wichtige Hinweise",
  termInfoText:
    "Der Erlös des Flohmarkts kommt ausschließlich dem Tierschutz zugute. Mitgliedsbeiträge und Spenden allein reichen für die medizinische Versorgung unserer Pfleglinge nicht aus.",
  termInfoText2:
    "Wir freuen uns über Ihren Besuch am Stand und über jede Unterstützung durch Einkäufe oder eine Mitgliedschaft.",
  termContactBtn: "Kontakt für Rückfragen",
  toastCopied: "Kopiert: ",
  toastCopyFailed: "Kopieren nicht möglich. Wert: ",
};

const factItems = [
  "Schätzungen zufolge leben rund 2.000.000 Straßenkatzen in Deutschland.",
  "99 % der Straßenkatzen sind krank, wenn Tierschutzvereine sie erstmals untersuchen.",
  "Bis zu 75 % der Kitten von Straßenkatzen erreichen nicht den 6. Lebensmonat.",
  "71 % der Tierschutzvereine berichten 2024 von steigenden Straßenkatzenpopulationen.",
  "Im Schnitt stammen 84 % der aufgenommenen Kitten laut Tierschutzvereinen von Straßenkatzen.",
  "Das Leid bleibt oft unsichtbar, weil Straßenkatzen meist scheu und im Verborgenen leben."
];

function t(key) {
  return text[key] || key;
}

function applyText() {
  qsa("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const value = t(key);
    if (value) el.textContent = value;
  });

  qsa("[data-i18n-aria-label]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria-label");
    const value = t(key);
    if (value) el.setAttribute("aria-label", value);
  });

  const themeToggle = qs("[data-theme-toggle]");
  if (themeToggle) {
    themeToggle.setAttribute("aria-label", t("themeAria"));
  }
}

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
    navToggle.removeAttribute("data-i18n");
    navToggle.textContent = "";
    navToggle.setAttribute("data-icon", "menu-2");
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
      navClose.setAttribute("aria-label", "Menue schliessen");
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

function setupToplineFacts() {
  const topbars = qsa(".topline");
  if (!topbars.length) return;

  const theme = root.getAttribute("data-theme") || "light";
  const folder = theme === "dark" ? "light" : "dark";
  const dividerIcons = ["paw.svg", "cat.svg", "fish-bone.svg"];
  let lastDivider = "";

  const randomDividerIcon = () => {
    const candidates = dividerIcons.filter((file) => file !== lastDivider);
    const file = candidates[Math.floor(Math.random() * candidates.length)];
    lastDivider = file;
    return new URL(`${folder}/${file}`, iconBase).href;
  };

  const syncMarqueeSpeed = (topline) => {
    const track = topline.querySelector(".fact-marquee__track");
    const group = topline.querySelector(".fact-marquee__group");
    if (!track || !group) return;

    const groupWidth = group.getBoundingClientRect().width;
    if (!groupWidth) return;

    const pxPerSecond = 52;
    const durationSeconds = Math.max(32, Math.round(groupWidth / pxPerSecond));
    track.style.setProperty("--facts-duration", `${durationSeconds}s`);
  };

  const buildFactGroup = () => {
    const group = document.createElement("div");
    group.className = "fact-marquee__group";

    factItems.forEach((fact, index) => {
      if (index > 0) {
        const paw = document.createElement("img");
        paw.className = "fact-marquee__paw";
        paw.alt = "";
        paw.setAttribute("aria-hidden", "true");
        paw.src = randomDividerIcon();
        group.appendChild(paw);
      }

      const item = document.createElement("span");
      item.className = "fact-marquee__item";
      item.textContent = fact;
      group.appendChild(item);
    });

    return group;
  };

  topbars.forEach((topline) => {
    topline.removeAttribute("data-i18n");
    topline.classList.add("topline--facts");

    let marquee = topline.querySelector(".fact-marquee");
    if (!marquee) {
      topline.textContent = "";

      marquee = document.createElement("div");
      marquee.className = "fact-marquee";
      marquee.setAttribute("aria-hidden", "true");

      const track = document.createElement("div");
      track.className = "fact-marquee__track";
      track.appendChild(buildFactGroup());
      track.appendChild(buildFactGroup());
      marquee.appendChild(track);

      const sr = document.createElement("span");
      sr.className = "fact-marquee__sr";
      sr.textContent = factItems.join(" ");

      topline.appendChild(marquee);
      topline.appendChild(sr);
    }

    syncMarqueeSpeed(topline);
  });

  if (!setupToplineFacts._resizeBound) {
    setupToplineFacts._resizeBound = true;
    let raf = 0;

    on(
      window,
      "resize",
      () => {
        if (raf) window.cancelAnimationFrame(raf);
        raf = window.requestAnimationFrame(() => {
          qsa(".topline").forEach((topline) => syncMarqueeSpeed(topline));
        });
      },
      { passive: true }
    );
  }
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
  applyText();
  setupToplineFacts();
  applyThemeIcons(root.getAttribute("data-theme"), iconBase);
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
      .then(() => showToast(t("toastCopied") + value))
      .catch(() => showToast(t("toastCopyFailed") + value));
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

      const title = (card.getAttribute("data-title") || t("modalTitle")).trim();
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

  qsa(".pdf-preview[data-pdf]").forEach((link) => {
    const pdfUrl = (link.getAttribute("data-pdf") || "").trim();
    const href = (link.getAttribute("href") || "").trim();
    if (pdfUrl && (!href || href === "#")) {
      link.setAttribute("href", pdfUrl);
    }
  });

  const openPdf = (url, title) => {
    const pdfUrl = normalizePdfUrl(url);
    if (!pdfUrl) return;
    modalTitle.textContent = title || t("modalTitle");
    if (modalFrame.getAttribute("data-current-pdf") !== pdfUrl) {
      modalFrame.setAttribute("src", pdfUrl);
      modalFrame.setAttribute("data-current-pdf", pdfUrl);
    }
    modal.classList.add("open");
    body.style.overflow = "hidden";
  };

  const closePdf = () => {
    modal.classList.remove("open");
    body.style.overflow = "";
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
    openPdf(pdfUrl, title);
  });

  if (modalBackdrop) on(modalBackdrop, "click", closePdf);
  if (modalClose) on(modalClose, "click", closePdf);

  on(document, "keydown", (event) => {
    if (event.key === "Escape") closePdf();
  });

  on(window, "pagehide", () => {
    modalFrame.setAttribute("src", "about:blank");
    modalFrame.removeAttribute("data-current-pdf");
  });

}

function setupHeaderScroll() {
  // Keep header behavior stable across devices (no compact-on-scroll mode).
  body.classList.remove("is-scrolled");
}

function setupHorizontalLock() {
  const isCoarsePointer =
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  if (!isCoarsePointer) return;

  const lockX = () => {
    const x = window.scrollX || window.pageXOffset || 0;
    if (x === 0) return;
    window.scrollTo(0, window.scrollY || window.pageYOffset || 0);
  };

  lockX();
  on(window, "scroll", lockX, { passive: true });
  on(window, "orientationchange", () => {
    window.setTimeout(lockX, 80);
  });
}

async function resolveBannerFiles() {
  try {
    const response = await fetch("/assets/banners/banner-manifest.json", { cache: "force-cache" });
    if (!response.ok) throw new Error("manifest fetch failed");
    const items = await response.json();
    const files = items
      .map((item) => item && item.file)
      .filter((file) => typeof file === "string")
      .map((file) => file.replace(/^.*[\\/]/, ""))
      .filter((file) => /^banner-\d{2}\.jpg$/i.test(file));
    if (files.length) return files;
  } catch (_) {
    // Keep silent and use fallback list.
  }

  return Array.from({ length: 28 }, (_, i) => `banner-${String(i + 1).padStart(2, "0")}.jpg`);
}

async function applyBannerImage() {
  const mode = body.getAttribute("data-banner-mode") || "none";
  if (mode !== "auto") return;

  const shell = qs(".page-shell--with-banner");
  if (!shell) return;

  const pageContent = qs(".page-content", shell);
  if (!pageContent) return;

  const splitTargets = Array.from(pageContent.children).filter(
    (el) => !el.classList.contains("page-banner")
  );
  if (splitTargets.length < 2) return;

  qsa(".page-banner[data-auto-banner]", pageContent).forEach((el) => el.remove());

  const files = await resolveBannerFiles();
  if (files.length < 4) return;
  const widthSets = [
    [34, 18, 27, 21],
    [21, 32, 18, 29],
    [29, 19, 34, 18],
    [18, 31, 23, 28],
    [26, 20, 36, 18],
  ];

  const shuffled = files.slice();
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }

  const picks = shuffled.slice(0, 4);
  const widths = widthSets[Math.floor(Math.random() * widthSets.length)];

  const banner = document.createElement("div");
  banner.className = "page-banner page-banner--inline";
  banner.setAttribute("aria-hidden", "true");
  banner.setAttribute("data-auto-banner", "true");

  picks.forEach((file, idx) => {
    const tile = document.createElement("span");
    tile.className = "page-banner__tile";
    tile.style.setProperty("--tile-grow", String(widths[idx] || 25));

    const img = document.createElement("img");
    img.src = new URL(file, bannerBase).href;
    img.alt = "";
    img.loading = idx === 0 ? "eager" : "lazy";
    img.decoding = "async";

    tile.appendChild(img);
    banner.appendChild(tile);
  });

  const insertAt = Math.min(
    splitTargets.length - 1,
    Math.max(1, Math.floor(splitTargets.length / 2))
  );
  pageContent.insertBefore(banner, splitTargets[insertAt]);
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
  setupHeaderScroll();
  setupHorizontalLock();
  applyBannerImage();
  setupClickPaw();
}

boot();
