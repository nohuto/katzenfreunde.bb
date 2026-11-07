import { initArt } from './art';
import { initCopy } from './clipboard';
import { initFolds } from './folds';
import { initGalleries } from './gallery';
import { initCounts, initDates } from './lists';
import { initMenu } from './menu';
import { initTheme } from './theme';
import { initZoom } from './zoom';

initTheme();
initMenu();
initCopy();
initFolds();
initDates();
initCounts();
initGalleries();
initArt();
initZoom();
