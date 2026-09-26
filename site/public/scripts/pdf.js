// Copyright (c) nohuto (N.B.)

import { qs, qsa, on, delegate } from "./dom.js";

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
  const dialog = qs("[data-pdf-modal]");
  if (!dialog) return;
  const title = qs("[data-modal-title]", dialog);
  let frame = null;

  qsa(".pdf-preview[data-pdf]").forEach((link) => {
    const pdfUrl = (link.getAttribute("data-pdf") || "").trim();
    const href = (link.getAttribute("href") || "").trim();
    if (pdfUrl && (!href || href === "#")) link.setAttribute("href", pdfUrl);
  });

  delegate("click", ".pdf-preview", (event, link) => {
    const pdfUrl = normalizePdfUrl(link.getAttribute("data-pdf") || link.getAttribute("href"));
    if (!pdfUrl) return;
    event.preventDefault();

    if (prefersNativePdfOpen()) {
      if (!window.open(pdfUrl, "_blank", "noopener")) window.location.href = pdfUrl;
      return;
    }

    if (!frame) {
      frame = document.createElement("iframe");
      frame.className = "modal__frame";
      frame.title = "PDF-Vorschau";
      dialog.append(frame);
    }
    title.textContent = link.getAttribute("data-title") || link.textContent.trim();
    if (frame.getAttribute("src") !== pdfUrl) frame.setAttribute("src", pdfUrl);
    dialog.showModal();
  });

  on(dialog, "click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  on(window, "pagehide", () => {
    if (frame) frame.setAttribute("src", "about:blank");
  });
}
