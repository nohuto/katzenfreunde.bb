type BrowserEvents = GlobalEventHandlersEventMap & WindowEventMap;

export function qs<T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T | null {
  return root.querySelector<T>(selector);
}

export function qsa<T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

export function on<K extends keyof BrowserEvents>(
  target: EventTarget | null,
  event: K,
  handler: (event: BrowserEvents[K]) => void,
  options?: AddEventListenerOptions,
): () => void {
  if (!target) return () => {};
  const listener = handler as EventListener;
  target.addEventListener(event, listener, options);
  return () => target.removeEventListener(event, listener, options);
}

export function delegate<K extends keyof BrowserEvents>(
  eventName: K,
  selector: string,
  handler: (event: BrowserEvents[K], target: HTMLElement) => void,
  root: Document | HTMLElement = document,
  options?: AddEventListenerOptions,
): () => void {
  return on(
    root,
    eventName,
    (event) => {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(selector)
          : null;
      if (target) handler(event, target);
    },
    options,
  );
}
