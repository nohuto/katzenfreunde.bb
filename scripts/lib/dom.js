// Copyright (c) Nohuto (N.B.)
export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function on(target, event, handler, options) {
  if (!target) return () => { };
  target.addEventListener(event, handler, options);
  return () => target.removeEventListener(event, handler, options);
}

export function delegate(eventName, selector, handler, root = document, options) {
  return on(
    root,
    eventName,
    (event) => {
      const target = event.target instanceof Element ? event.target.closest(selector) : null;
      if (!target) return;
      handler(event, target);
    },
    options
  );
}
