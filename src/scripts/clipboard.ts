const COPY_RESET_MS = 2500;

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function initCopy(): void {
  const live = document.querySelector('[data-live-region]');
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    '[data-copy]',
  )) {
    const label = button.querySelector('[data-copy-label]');
    if (!label) continue;
    const idle = label.textContent;
    const what = button.dataset.what;
    let reset: ReturnType<typeof setTimeout> | undefined;
    button.addEventListener('click', async () => {
      const copied = await copyText(button.dataset.copy ?? '');
      label.textContent = copied ? 'Kopiert' : 'Manuell kopieren';
      button.toggleAttribute('data-done', copied);
      if (live)
        live.textContent = copied
          ? `${what} kopiert`
          : `Kopieren nicht möglich. Bitte markieren und kopieren Sie ${what} von Hand.`;
      clearTimeout(reset);
      reset = setTimeout(() => {
        label.textContent = idle;
        delete button.dataset.done;
      }, COPY_RESET_MS);
    });
  }
}
