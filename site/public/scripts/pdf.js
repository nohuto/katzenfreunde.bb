// Copyright (c) nohuto (N.B.)

import { qs, qsa, on, delegate } from "./dom.js";

const body = document.body;

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

export function setupPdfPreviews() {
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

export function setupPdfModal() {
  const modal = qs("[data-pdf-modal]");
  const modalBackdrop = modal ? qs("[data-modal-backdrop]", modal) : null;
  const modalClose = modal ? qs("[data-modal-close]", modal) : null;
  const modalTitle = modal ? qs("[data-modal-title]", modal) : null;
  const modalDialog = modal ? qs(".modal__dialog", modal) : null;

  if (!modal || !modalTitle || !modalDialog) return;
  let returnFocus = null;

  let modalFrame = null;
  const ensureFrame = () => {
    if (!modalFrame) {
      modalFrame = document.createElement("iframe");
      modalFrame.className = "modal__frame";
      modalFrame.title = "PDF-Vorschau";
      modalDialog.append(modalFrame);
    }
    return modalFrame;
  };

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
    const frame = ensureFrame();
    if (frame.getAttribute("data-current-pdf") !== pdfUrl) {
      frame.setAttribute("src", pdfUrl);
      frame.setAttribute("data-current-pdf", pdfUrl);
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
    if (!modalFrame) return;
    modalFrame.setAttribute("src", "about:blank");
    modalFrame.removeAttribute("data-current-pdf");
  });

}
