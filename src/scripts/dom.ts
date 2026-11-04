export function eventElement(event: Event): Element | null {
  return event.target instanceof Element ? event.target : null;
}
