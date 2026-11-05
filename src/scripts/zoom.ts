import { eventElement } from './dom';

export function initZoom(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-zoom-view]');
  const image = dialog?.querySelector('img');
  if (!dialog || !image) return;
  document.addEventListener('click', (event) => {
    const target = eventElement(event);
    const link =
      target?.closest<HTMLAnchorElement>('a[data-zoom]') ??
      target
        ?.closest('.photo > picture')
        ?.parentElement?.querySelector<HTMLAnchorElement>(':scope > .zoom');
    if (
      !link ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    image.src = link.href;
    image.alt =
      link.dataset.zoom ||
      link
        .closest('figure')
        ?.querySelector('figcaption')
        ?.textContent?.trim() ||
      '';
    dialog.showModal();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== image) dialog.close();
  });
  image.addEventListener('load', () => {
    image.style.setProperty('--w', String(image.naturalWidth));
    image.style.setProperty(
      '--ratio',
      String(image.naturalWidth / image.naturalHeight),
    );
  });
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    image.removeAttribute('style');
  });
}
