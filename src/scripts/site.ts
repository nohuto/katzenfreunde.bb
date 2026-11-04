import { initArt } from './art';
import { initCopy } from './clipboard';
import { initGalleries } from './gallery';
import { initCounts, initDates } from './lists';
import { initMenu } from './menu';
import { initTheme } from './theme';

initTheme();
initMenu();
initCopy();
initDates();
initCounts();
initGalleries();
initArt();
