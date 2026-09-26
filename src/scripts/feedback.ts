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

function copyText(textToCopy: string | null): Promise<void> {
  if (!textToCopy) return Promise.reject(new Error('no text'));

  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(textToCopy);
  }

  const el = document.createElement('textarea');
  el.value = textToCopy;
  el.setAttribute('readonly', '');
  el.className = 'hidden';
  document.body.appendChild(el);
  el.select();

  try {
    const copied = document.execCommand('copy');
    document.body.removeChild(el);
    return copied
      ? Promise.resolve()
      : Promise.reject(new Error('copy failed'));
  } catch (err) {
    document.body.removeChild(el);
    return Promise.reject(err);
  }
}

export function setupCopyButtons(showToast: (message: string) => void) {
  delegate('click', '[data-copy-email], [data-copy-text]', (event, target) => {
    if (target.tagName.toLowerCase() === 'a') {
      event.preventDefault();
    }

    const value =
      target.getAttribute('data-copy-text') ||
      target.getAttribute('data-copy-email');
    copyText(value)
      .then(() => showToast(`Kopiert: ${value}`))
      .catch(() => showToast(`Kopieren nicht mÃ¶glich. Wert: ${value}`));
  });
}
