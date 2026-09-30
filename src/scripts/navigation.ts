import { qs, on, delegate } from './dom';

export function setupNavigation() {
  const navToggle = qs('[data-nav-toggle]');
  const navWrap = qs('[data-nav-wrap]');
  const dropdown = qs('.has-dropdown');
  const dropdownToggle = qs('.nav-dropdown-toggle');
  const mobileNav = matchMedia('(max-width: 1100px)');

  const setNav = (open: boolean) => {
    if (navWrap?.classList.contains('open') === open) return;
    navWrap?.toggleAttribute('data-motion', mobileNav.matches);
    navWrap?.classList.toggle('open', open);
    navToggle?.setAttribute('aria-expanded', String(open));
    navToggle?.setAttribute(
      'aria-label',
      open ? 'Menü schließen' : 'Menü öffnen',
    );
    document.body.classList.toggle('nav-drawer-open', open);
  };

  const setDropdown = (open: boolean) => {
    dropdown?.classList.toggle('is-open', open);
    dropdownToggle?.setAttribute('aria-expanded', String(open));
  };

  on(navToggle, 'click', () => setNav(!navWrap?.classList.contains('open')));

  on(dropdownToggle, 'click', () =>
    setDropdown(!dropdown?.classList.contains('is-open')),
  );

  delegate('click', '.nav-wrap a', () => {
    setDropdown(false);
    setNav(false);
  });

  on(document, 'click', ({ target }) => {
    if (!(target instanceof Element) || target.closest('.has-dropdown')) return;
    setDropdown(false);
    if (mobileNav.matches && !target.closest('.site-header')) setNav(false);
  });

  on(document, 'keydown', (event) => {
    if (event.key !== 'Escape') return;
    setDropdown(false);
    setNav(false);
  });

  on(mobileNav, 'change', () => {
    navWrap?.removeAttribute('data-motion');
    if (!mobileNav.matches) setNav(false);
  });
}
