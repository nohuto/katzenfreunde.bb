import { qs, on, delegate } from './dom';

const body = document.body;

export function setupNavigation() {
  const navToggle = qs('[data-nav-toggle]');
  const navWrap = qs('[data-nav-wrap]');

  const isMobileNav = () =>
    window.matchMedia && window.matchMedia('(max-width: 1100px)').matches;

  let navClose = null;

  if (navToggle) {
    const toggleLabel =
      (navToggle.textContent || '').trim() ||
      navToggle.getAttribute('aria-label') ||
      'Menu';
    navToggle.textContent = '';
    navToggle.setAttribute('aria-label', toggleLabel);
  }

  if (navWrap) {
    navWrap.setAttribute('aria-hidden', isMobileNav() ? 'true' : 'false');

    let drawerHead = qs('.nav-drawer-head', navWrap);
    if (!drawerHead) {
      drawerHead = document.createElement('div');
      drawerHead.className = 'nav-drawer-head';
      navWrap.prepend(drawerHead);
    }

    let drawerFoot = qs('.nav-drawer-foot', navWrap);
    if (!drawerFoot) {
      drawerFoot = document.createElement('div');
      drawerFoot.className = 'nav-drawer-foot';
      navWrap.appendChild(drawerFoot);
    }

    let drawerQuick = qs('.nav-drawer-quick', drawerFoot);
    if (!drawerQuick) {
      drawerQuick = document.createElement('div');
      drawerQuick.className = 'nav-drawer-quick';
      drawerFoot.appendChild(drawerQuick);

      const quickItems = [
        {
          kind: 'link',
          icon: 'phone',
          label: 'Telefon anrufen',
          href: 'tel:+49704234355',
        },
        {
          kind: 'button',
          icon: 'mail',
          label: 'E-Mail kopieren',
          copyEmail: 'info@katzenfreunde-bietigheim-bissingen.de',
        },
        {
          kind: 'link',
          icon: 'brand-whatsapp',
          label: 'WhatsApp',
          href: 'https://wa.me/4915772702827',
          external: true,
        },
        {
          kind: 'link',
          icon: 'brand-facebook',
          label: 'Facebook',
          href: 'https://www.facebook.com/katzenfreundebibi/',
          external: true,
        },
        {
          kind: 'link',
          icon: 'brand-instagram',
          label: 'Instagram',
          href: 'https://www.instagram.com/katzenfreunde_bietigheim/',
          external: true,
        },
      ];

      quickItems.forEach((item) => {
        const el =
          item.kind === 'button'
            ? document.createElement('button')
            : document.createElement('a');

        if (item.kind === 'button') {
          el.type = 'button';
          el.className = 'icon-btn nav-drawer-quick__icon';
          el.setAttribute('data-copy-email', item.copyEmail || '');
        } else {
          el.className = 'icon-link nav-drawer-quick__icon';
          el.setAttribute('href', item.href || '#');
          if (item.external) {
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
          }
        }

        el.setAttribute('data-icon', item.icon);
        el.setAttribute('aria-label', item.label);
        drawerQuick?.appendChild(el);
      });
    }

    navClose = qs('[data-nav-close]', navWrap);
    if (!navClose) {
      navClose = document.createElement('button');
      navClose.type = 'button';
      navClose.className = 'nav-drawer-close';
      navClose.setAttribute('data-nav-close', '');
      navClose.setAttribute('data-icon', 'x');
      navClose.setAttribute('aria-label', 'MenÃ¼ schlieÃŸen');
      drawerHead.appendChild(navClose);
    }
  }

  const closeMobileNav = () => {
    if (!navToggle || !navWrap) return;
    navWrap.classList.remove('open');
    navWrap.setAttribute('aria-hidden', isMobileNav() ? 'true' : 'false');
    navToggle.setAttribute('aria-expanded', 'false');
    body.classList.remove('nav-drawer-open');
  };

  if (navToggle && navWrap) {
    on(navToggle, 'click', () => {
      const isOpen = navWrap.classList.toggle('open');
      navWrap.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      body.classList.toggle('nav-drawer-open', isOpen);

      if (isOpen && navClose) {
        navClose.focus({ preventScroll: true });
      }
    });
  }

  if (navClose) {
    on(navClose, 'click', () => {
      closeMobileNav();
      if (navToggle) navToggle.focus({ preventScroll: true });
    });
  }

  const dropdown = qs('.has-dropdown');
  const dropdownToggle = qs('.nav-dropdown-toggle');
  const setDropdown = (open: boolean) => {
    if (!dropdown || !dropdownToggle) return;
    dropdown.classList.toggle('is-open', open);
    dropdownToggle.setAttribute('aria-expanded', String(open));
  };

  on(dropdownToggle, 'click', () =>
    setDropdown(!dropdown?.classList.contains('is-open')),
  );

  delegate('click', '.nav-wrap a', () => {
    setDropdown(false);
    closeMobileNav();
  });

  on(document, 'click', ({ target }) => {
    if (!(target instanceof Element) || target.closest('.has-dropdown')) return;
    setDropdown(false);
    if (isMobileNav() && !target.closest('.site-header')) closeMobileNav();
  });

  on(document, 'keydown', (event) => {
    if (event.key !== 'Escape') return;
    setDropdown(false);
    closeMobileNav();
  });

  on(window, 'resize', () => {
    if (isMobileNav()) return;
    closeMobileNav();
    if (navWrap) navWrap.setAttribute('aria-hidden', 'false');
  });
}
