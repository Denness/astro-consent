interface HeadScriptOptions {
  gaId?: string;
  adsId?: string;
  clarityId?: string;
  pageViewsOnNavigation: boolean;
}

/**
 * Inline <head> script: Consent Mode v2 defaults, a stored choice applied before the
 * first hit, then the Google tag config. Runs before the banner library has loaded,
 * so a returning visitor's page view already carries their consent.
 */
export function headScript({ gaId, adsId, clarityId, pageViewsOnNavigation }: HeadScriptOptions): string {
  return `(function () {
  var w = window;
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function gtag() { w.dataLayer.push(arguments); };

  // View transitions re-run inline head scripts. Re-sending the defaults would reset
  // granted consent to denied, and a second config() would double-count the page view.
  if (w.__astroConsent) return;

  var GA_ID = ${JSON.stringify(gaId ?? '')};
  var ADS_ID = ${JSON.stringify(adsId ?? '')};
  var CLARITY_ID = ${JSON.stringify(clarityId ?? '')};
  var gtag = w.gtag;

  function loadClarity() {
    if (!CLARITY_ID || w.__astroConsentClarity) return;
    w.__astroConsentClarity = true;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(w, document, 'clarity', 'script', CLARITY_ID);
    // Clarity needs an explicit consent signal for UK and EEA visitors.
    w.clarity('consent');
  }

  // categories: the accepted vanilla-cookieconsent categories, e.g. ['necessary', 'analytics'].
  function apply(categories) {
    var analytics = categories.indexOf('analytics') !== -1;
    var marketing = categories.indexOf('marketing') !== -1;
    gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: marketing ? 'granted' : 'denied',
      ad_user_data: marketing ? 'granted' : 'denied',
      ad_personalization: marketing ? 'granted' : 'denied'
    });
    if (analytics) loadClarity();
    else if (typeof w.clarity === 'function') w.clarity('consent', false);
  }

  // vanilla-cookieconsent stores its state as URL-encoded JSON in cc_cookie.
  function storedCategories() {
    var row = document.cookie.split('; ').filter(function (r) { return r.indexOf('cc_cookie=') === 0; })[0];
    if (!row) return null;
    try {
      var parsed = JSON.parse(decodeURIComponent(row.slice('cc_cookie='.length)));
      return Array.isArray(parsed.categories) ? parsed.categories : null;
    } catch (e) {
      return null;
    }
  }

  w.__astroConsent = { apply: apply };

  // Everything starts denied (Consent Mode v2, advanced): tags load but send only
  // cookieless pings until someone accepts, which keeps Google's conversion modelling.
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

  if (ADS_ID) {
    // Without ad cookies the gclid would be lost on the next page; carry it in links
    // instead, and strip ad identifiers from the unconsented pings.
    gtag('set', 'url_passthrough', true);
    gtag('set', 'ads_data_redaction', true);
  }

  var stored = storedCategories();
  if (stored) apply(stored);

  gtag('js', new Date());
  if (GA_ID) gtag('config', GA_ID, { cookie_flags: 'SameSite=Lax;Secure' });
  // Configuring the Ads id also installs the conversion linker.
  if (ADS_ID) gtag('config', ADS_ID);

  if (${pageViewsOnNavigation ? 'true' : 'false'} && GA_ID) {
    var firstLoad = true;
    document.addEventListener('astro:page-load', function () {
      if (firstLoad) { firstLoad = false; return; }
      gtag('event', 'page_view', {
        page_location: location.href,
        page_path: location.pathname + location.search,
        page_title: document.title
      });
    });
  }
})();`;
}
