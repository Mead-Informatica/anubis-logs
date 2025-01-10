import { CoreSetup, CoreStart, Plugin } from '@kbn/core/public';
import { CUSTOM_NAME } from './consts';

import icon from './assets/icon.ico';

export interface CustomKibanaThemePluginContract {}
interface FaviconConfig {
  emoji?: string;
  href?: string;
}

export class CustomKibanaThemePlugin
  implements Plugin<CustomKibanaThemePluginContract, CustomKibanaThemePluginContract>
{
  private curAppClass?: string;

  constructor() {
    console.log('Loaded CustomKibanaThemePlugin');

    // Update the favicon programmatically
    this.changeFavicon({
      href: icon,
    });
    this.setupTabNameListener();
  }

  public setup(core: CoreSetup): CustomKibanaThemePluginContract {
    core.getStartServices().then(([start]) => {
      if (start.application && start.application.currentAppId$) {
        start.application.currentAppId$.subscribe({
          next: (currApp) => this.setBodyClass(currApp),
          error: (err) => console.error('Error subscribing to currentAppId$', err),
        });
      } else {
        console.warn('currentAppId$ is not available. Verify Kibana API changes.');
      }
    });

    return {};
  }

  public start(core: CoreStart): CustomKibanaThemePluginContract {
    console.log('CustomKibanaThemePlugin started');
    return {};
  }

  public stop() {
    if (this.curAppClass) {
      document.body.classList.remove(this.curAppClass);
      this.curAppClass = undefined;
    }
  }

  private changeFavicon({ emoji, href }: FaviconConfig) {
    let faviconHref: string | undefined = undefined;

    if (href) {
      faviconHref = href;
    } else if (emoji) {
      const canvas = document.createElement('canvas');
      canvas.height = 64;
      canvas.width = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.font = '64px serif';
      ctx.fillText('🐋', 0, 64);

      faviconHref = canvas.toDataURL();
    }

    if (faviconHref) {
      const link = document.createElement('link');
      const oldLinks = document.querySelectorAll('link[rel~="icon"]');
      oldLinks.forEach((e) => e.parentNode?.removeChild(e));
      link.id = 'dynamic-favicon';
      link.rel = 'shortcut icon';
      link.href = faviconHref;
      document.head.appendChild(link);
    }
  }

  private setupTabNameListener() {
    new MutationObserver(function () {
      const title = document.title;
      if (title) {
        let newTitle = document.title;
        if (newTitle.indexOf(' - Elastic') > -1) {
          newTitle = newTitle.replace(' - Elastic', '');
          newTitle = `${newTitle} | ${CUSTOM_NAME}`;
        }
        if (newTitle === 'Elastic') {
          newTitle = CUSTOM_NAME;
        }

        if (newTitle !== title) {
          document.title = newTitle;
        }
      }
    }).observe(document.querySelector('title')!, {
      subtree: true,
      characterData: true,
      childList: true,
    });
  }

  private setBodyClass(curApp?: string) {
    if (this.curAppClass) {
      document.body.classList.remove(this.curAppClass);
      this.curAppClass = undefined;
    }

    if (curApp) {
      this.curAppClass = `ckl-app-${curApp}`;
      document.body.classList.add(this.curAppClass);
    }
  }
}
