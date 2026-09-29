// Copyright (c) nohuto (N.B.)

import { qs, on, delegate } from './dom.ts';

export function setupPdfModal() {
  const dialog = qs<HTMLDialogElement>('[data-pdf-modal]');
  const title = dialog && qs('[data-modal-title]', dialog);
  if (!dialog || !title) return;
  const coarsePointer = matchMedia('(pointer: coarse)');
  let frame: HTMLIFrameElement | null = null;

  delegate('click', '.pdf-preview', (event, link) => {
    const href = link.getAttribute('href');
    if (
      !href ||
      coarsePointer.matches ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;
    event.preventDefault();

    if (!frame) {
      frame = document.createElement('iframe');
      frame.className = 'modal__frame';
      frame.title = 'PDF-Vorschau';
      dialog.append(frame);
    }
    title.textContent = link.dataset.title || link.textContent.trim();
    if (frame.getAttribute('src') !== href) frame.setAttribute('src', href);
    dialog.showModal();
  });

  on(dialog, 'click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  on(window, 'pagehide', () => {
    frame?.setAttribute('src', 'about:blank');
  });
}
