import { setupNavigation } from './navigation';
import { setupTheme } from './theme';
import { createToast, setupCopyButtons } from './feedback';
import { setupPawClicks } from './paw-feedback';
import { consumeNotFoundPath, rememberActivePage, showNotFoundDialog } from './not-found';

const notFoundPath = consumeNotFoundPath();
rememberActivePage();

setupNavigation();
setupTheme();

const showToast = createToast();
setupCopyButtons(showToast);
if (document.querySelector('.pdf-inline-card[data-pdf], .pdf-preview[data-pdf]')) {
  import('./pdf').then(({ setupPdfPreviews, setupPdfModal }) => {
    setupPdfPreviews();
    setupPdfModal();
  }).catch(() => showToast('PDF-Vorschau konnte nicht geladen werden.'));
}
setupPawClicks();

if (notFoundPath) showNotFoundDialog(notFoundPath);
