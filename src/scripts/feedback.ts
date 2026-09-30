import { qs, delegate } from './dom';

export function createToast() {
  const toast = qs('[data-toast]');
  if (!toast) return () => {};

  let timer: ReturnType<typeof setTimeout> | undefined;
  return (message: string) => {
    toast.textContent = message;
    toast.classList.add('show');
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  };
}

const copiedTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

function markCopied(target: HTMLElement) {
  target.dataset.copied = '';
  clearTimeout(copiedTimers.get(target));
  copiedTimers.set(
    target,
    setTimeout(() => delete target.dataset.copied, 1600),
  );
}

export function setupCopyButtons(showToast: (message: string) => void) {
  delegate('click', '[data-copy-email], [data-copy-text]', (event, target) => {
    if (target.tagName.toLowerCase() === 'a') {
      event.preventDefault();
    }

    const value = target.dataset.copyText || target.dataset.copyEmail || '';
    navigator.clipboard
      .writeText(value)
      .then(() => {
        markCopied(target);
        showToast(`Kopiert: ${value}`);
      })
      .catch(() => showToast(`Kopieren nicht möglich. Wert: ${value}`));
  });
}
