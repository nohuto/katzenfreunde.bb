import { initArt } from './art';
import { initCopy } from './clipboard';
import { initGalleries } from './gallery';
import { initCounts, initDates } from './lists';
import { initMenu } from './menu';
import { initTheme } from './theme';
import { initZoom } from './zoom';

initTheme();
initMenu();
initCopy();
initDates();
initCounts();
initGalleries();
initArt();
initZoom();
