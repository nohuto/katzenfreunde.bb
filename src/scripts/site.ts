import { setupNavigation } from './navigation';
import { setupTheme } from './theme';
import { createToast, setupCopyButtons } from './feedback';
import { setupPawClicks } from './paw-feedback';
import { setupPdfModal } from './pdf';
import {
  consumeNotFoundPath,
  rememberActivePage,
  showNotFoundDialog,
} from './not-found';

const notFoundPath = consumeNotFoundPath();
rememberActivePage();

setupNavigation();
setupTheme();
setupCopyButtons(createToast());
setupPdfModal();
setupPawClicks();

if (notFoundPath) showNotFoundDialog(notFoundPath);
