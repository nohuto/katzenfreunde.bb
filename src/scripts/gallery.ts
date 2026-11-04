import { eventElement } from './dom';

export function initGalleries(): void {
  for (const gallery of document.querySelectorAll('[data-gallery]')) {
    const track = gallery.querySelector<HTMLElement>('[data-gallery-track]');
    const counter = gallery.querySelector('[data-gallery-n]');
    if (!track || !counter) continue;
    const index = () => Math.round(track.scrollLeft / track.clientWidth);
    const last = () => track.children.length - 1;
    gallery.addEventListener('click', (event) => {
      const button = eventElement(event)?.closest<HTMLElement>(
        '[data-gallery-step]',
      );
      if (!button) return;
      const step = Number(button.dataset.galleryStep);
      let at = index();
      if (step > 0 && at === last() && track.firstElementChild) {
        track.append(track.firstElementChild);
        at -= 1;
        track.scrollTo({ left: at * track.clientWidth, behavior: 'instant' });
      } else if (step < 0 && at === 0 && track.lastElementChild) {
        track.prepend(track.lastElementChild);
        at += 1;
        track.scrollTo({ left: at * track.clientWidth, behavior: 'instant' });
      }
      track.scrollTo({ left: (at + step) * track.clientWidth });
    });
    track.addEventListener(
      'scroll',
      () => {
        const slide = track.children[index()];
        counter.textContent =
          slide instanceof HTMLElement ? (slide.dataset.slide ?? '1') : '1';
      },
      { passive: true },
    );
  }
}
