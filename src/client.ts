import * as CookieConsent from 'vanilla-cookieconsent';
import type { CookieConsentConfig } from 'vanilla-cookieconsent';
import type { ClientConfig } from './types';

declare global {
  interface Window {
    __astroConsent?: { apply: (categories: string[]) => void };
    __astroConsentStarted?: boolean;
  }
}

const link = (href: string, text: string) => `<a href="${href}">${text}</a>`;

// Classes vanilla-cookieconsent puts on <html> to show and animate its modals.
const HTML_CLASSES = ['cc--anim', 'show--consent', 'show--preferences', 'disable--interaction'];

function buildConfig(cfg: ClientConfig, root: HTMLElement): CookieConsentConfig {
  const sync = ({ cookie }: { cookie: { categories: string[] } }) => window.__astroConsent?.apply(cookie.categories);

  const analyticsServices = [cfg.services.ga && 'Google Analytics', cfg.services.clarity && 'Microsoft Clarity']
    .filter(Boolean)
    .join(' and ');

  const purposes = [
    cfg.analytics && 'understand how people use this site',
    cfg.marketing && 'measure which of our adverts bring people here',
  ]
    .filter(Boolean)
    .join(' and ');

  const categories: CookieConsentConfig['categories'] = { necessary: { enabled: true, readOnly: true } };
  const sections: { title: string; description: string; linkedCategory?: string }[] = [
    {
      title: 'How we use cookies',
      description: `We'd like to use cookies to ${purposes}. They are only set if you allow them, and you can change your mind at any time.`,
    },
    {
      title: 'Strictly necessary',
      description: 'Needed for the site to work, including remembering your cookie choice. These are always on.',
      linkedCategory: 'necessary',
    },
  ];

  if (cfg.analytics) {
    categories.analytics = {
      autoClear: { cookies: [{ name: /^_ga/ }, { name: /^_clck/ }, { name: /^_clsk/ }, { name: /^CLID/ }] },
    };
    sections.push({
      title: 'Analytics',
      description: `${analyticsServices} show us which pages people visit and how they use them, so we can improve the site.`,
      linkedCategory: 'analytics',
    });
  }

  if (cfg.marketing) {
    categories.marketing = { autoClear: { cookies: [{ name: /^_gcl/ }] } };
    sections.push({
      title: 'Marketing',
      description: "Google Ads tells us which of our adverts led to an enquiry, so we spend less on ones that don't work.",
      linkedCategory: 'marketing',
    });
  }

  const more = [
    cfg.privacyUrl && `Read our ${link(cfg.privacyUrl, 'privacy policy')}.`,
    cfg.contactUrl && `Questions? ${link(cfg.contactUrl, 'Contact us')}.`,
  ].filter(Boolean);
  if (more.length) sections.push({ title: 'More information', description: more.join(' ') });

  return {
    root,
    revision: cfg.revision,
    guiOptions: {
      // A slim bar along the bottom: no layout shift, and too small to become the
      // page's largest element on mobile.
      consentModal: { layout: 'bar inline', position: 'bottom', equalWeightButtons: true, flipButtons: false },
      preferencesModal: { layout: 'box', equalWeightButtons: true, flipButtons: false },
    },
    categories,
    onConsent: sync,
    onChange: sync,
    language: {
      default: 'en',
      translations: {
        en: {
          consentModal: {
            title: 'We use cookies',
            description:
              `We'd like to use cookies to ${purposes}. Nothing is set unless you accept.` +
              (cfg.privacyUrl ? ` ${link(cfg.privacyUrl, 'Privacy policy')}` : ''),
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            showPreferencesBtn: 'Manage preferences',
          },
          preferencesModal: {
            title: 'Cookie preferences',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            savePreferencesBtn: 'Save preferences',
            closeIconLabel: 'Close',
            sections,
          },
        },
      },
    },
  };
}

export function start(): void {
  const el = document.getElementById('astro-consent-config');
  if (!el?.textContent || window.__astroConsentStarted) return;
  window.__astroConsentStarted = true;

  const cfg = JSON.parse(el.textContent) as ClientConfig;

  // Own container, re-attached after view transitions replace <body>.
  const root = document.createElement('div');
  root.id = 'astro-consent-root';
  document.body.appendChild(root);
  document.addEventListener('astro:after-swap', () => {
    if (!root.isConnected) document.body.appendChild(root);
  });

  // View transitions also replace <html>'s classes, which is where the library records
  // whether the banner or preferences panel is showing. Carry them over, or an
  // unanswered banner vanishes on the next page.
  document.addEventListener('astro:before-swap', (event) => {
    const next = (event as Event & { newDocument: Document }).newDocument.documentElement;
    for (const name of HTML_CLASSES) {
      if (document.documentElement.classList.contains(name)) next.classList.add(name);
    }
  });

  // Delegated, so "Cookie settings" links in swapped-in markup still work.
  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    if (target?.closest?.('[data-consent-settings]')) {
      event.preventDefault();
      CookieConsent.showPreferences();
    }
  });

  CookieConsent.run(buildConfig(cfg, root));
}
