import { delegate } from './dom';

const body = document.body;

function prefersReducedMotion() {
  return Boolean(
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
}

export function setupPawClicks() {
  if (prefersReducedMotion()) return;

  const selector =
    'button, .btn, .icon-btn, .icon-link, .theme-toggle, .main-nav a, .submenu a';
  delegate('pointerdown', selector, (event) => {
    const paw = document.createElement('span');
    paw.className = 'paw-click';
    paw.style.left = `${event.clientX}px`;
    paw.style.top = `${event.clientY}px`;
    body.appendChild(paw);

    setTimeout(() => paw.remove(), 600);
  });
}
