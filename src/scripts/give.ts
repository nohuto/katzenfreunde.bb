import { bank } from '../data/site';

const QR_DELAY_MS = 150;
const TIP_CLOSE_MS = 200;

const euro = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const parseAmount = (raw: string) => {
  const clean = raw
    .replace(/\s|€/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(clean)) return null;
  const value = Number(clean);
  return value >= 1 ? value : null;
};

const epc = (amount: number | null) =>
  [
    'BCD',
    '002',
    '1',
    'SCT',
    bank.bic,
    bank.name,
    bank.iban,
    amount ? `EUR${amount.toFixed(2)}` : '',
    '',
    '',
    'Spende',
  ].join('\n');

function initGiroCode(give: HTMLElement) {
  const input = give.querySelector<HTMLInputElement>('#betrag-eingabe');
  const qr = give.querySelector<HTMLElement>('[data-qr]');
  const tiers = [...give.querySelectorAll<HTMLElement>('[data-tier]')];
  const error = give.querySelector<HTMLElement>('[data-amount-error]');
  const hint = input?.getAttribute('aria-describedby') ?? '';
  if (!input || !qr) return;
  const blank = qr.innerHTML;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let request = 0;

  const markTier = (amount: number | null) => {
    const tier = amount
      ? tiers.filter((el) => Number(el.dataset.tier) <= amount).at(-1)
      : undefined;
    for (const el of tiers) el.classList.toggle('is-on', el === tier);
  };

  const drawCode = async (amount: number | null) => {
    const mine = ++request;
    if (!amount) {
      qr.innerHTML = blank;
      return;
    }
    let svg: string;
    try {
      const { toString } = await import('qrcode');
      svg = await toString(epc(amount), {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 4,
        color: { dark: '#1c2519', light: '#ffffff' },
      });
    } catch {
      if (mine === request) qr.innerHTML = blank;
      return;
    }
    if (mine !== request) return;
    qr.innerHTML = svg.replace(
      '<svg ',
      `<svg role="img" aria-label="GiroCode für eine Spende von ${euro.format(amount)}\u00A0€" width="140" height="140" `,
    );
  };

  input.addEventListener('input', () => {
    const amount = parseAmount(input.value);
    const invalid = input.value.trim() !== '' && amount === null;
    if (invalid) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    input.setAttribute(
      'aria-describedby',
      invalid && error ? `${error.id} ${hint}` : hint,
    );
    if (error) error.hidden = !invalid;
    markTier(amount);
    clearTimeout(timer);
    timer = setTimeout(() => void drawCode(amount), QR_DELAY_MS);
  });
  input.addEventListener('blur', () => {
    const amount = parseAmount(input.value);
    if (amount) input.value = euro.format(amount);
  });
}

function initTip(tip: HTMLElement) {
  const buttons = [
    ...document.querySelectorAll<HTMLElement>('[popovertarget="betrag-info"]'),
  ];
  if (!buttons.length) return;
  const place = () => {
    const button =
      buttons.find((el) => el.getClientRects().length) ?? buttons[0];
    const r = button.getBoundingClientRect();
    const left = Math.max(
      16,
      Math.min(r.left - 12, innerWidth - tip.offsetWidth - 16),
    );
    const below = r.bottom + 8;
    tip.style.left = `${left}px`;
    tip.style.top = `${below + tip.offsetHeight > innerHeight - 8 ? Math.max(8, r.top - tip.offsetHeight - 8) : below}px`;
  };
  const isOpen = () => tip.matches(':popover-open');
  tip.addEventListener('toggle', (event) => {
    if (event.newState === 'open') place();
    else byHover = false;
  });
  addEventListener('scroll', () => isOpen() && place(), { passive: true });
  addEventListener('resize', () => isOpen() && place());
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  let byHover = false;
  let closer: ReturnType<typeof setTimeout> | undefined;
  const open = () => {
    clearTimeout(closer);
    if (!hover.matches || isOpen()) return;
    tip.showPopover();
    byHover = true;
  };
  const close = () => {
    clearTimeout(closer);
    if (byHover) closer = setTimeout(() => tip.hidePopover(), TIP_CLOSE_MS);
  };
  for (const el of [...buttons, tip]) {
    el.addEventListener('pointerenter', open);
    el.addEventListener('pointerleave', close);
  }
  for (const button of buttons)
    button.addEventListener('click', (event) => {
      if (!byHover) return;
      event.preventDefault();
      byHover = false;
    });
}

export function initGive(): void {
  const give = document.querySelector<HTMLElement>('[data-give]');
  if (give) initGiroCode(give);
  const tip = document.getElementById('betrag-info');
  if (tip) initTip(tip);
}
