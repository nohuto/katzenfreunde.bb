import { qs, on } from './dom';

const body = document.body;
const ACTIVE_PAGE_KEY = 'kf-active-page-path';
const NOT_FOUND_KEY = 'kf-not-found-path';

export function rememberActivePage() {
  try {
    sessionStorage.setItem(ACTIVE_PAGE_KEY, location.pathname === "/" ? "/index.html" : location.pathname);
  } catch (_) {
  }
}

export function consumeNotFoundPath() {
  try {
    const path = sessionStorage.getItem(NOT_FOUND_KEY) || "";
    sessionStorage.removeItem(NOT_FOUND_KEY);
    return path;
  } catch (_) {
    return "";
  }
}

function readablePath(path: string) {
  try {
    return decodeURI(path);
  } catch (_) {
    return path;
  }
}

export function showNotFoundDialog(path: string) {
  const dialog = document.createElement("dialog");
  dialog.className = "modal__dialog modal__dialog--compact";
  dialog.setAttribute("role", "alertdialog");
  dialog.setAttribute("aria-labelledby", "not-found-title");
  dialog.setAttribute("aria-describedby", "not-found-message");
  dialog.innerHTML = `
    <div class="modal__head">
      <p class="modal__title" id="not-found-title">404</p>
      <form class="modal__actions" method="dialog">
        <button aria-label="SchlieÃŸen" class="modal__close modal__close--icon" data-icon="x"></button>
      </form>
    </div>
    <div class="modal__body">
      <p id="not-found-message">Die angeforderte Seite wurde nicht gefunden.</p>
      <code class="modal__path"></code>
    </div>`;
  const pathNode = qs(".modal__path", dialog);
  if (pathNode) pathNode.textContent = readablePath(path);
  on(dialog, "click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  on(dialog, "close", () => dialog.remove());
  body.append(dialog);
  dialog.showModal();
}
